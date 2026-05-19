-- ABRANE — Migration 007 : création d'utilisateur sans email Supabase
-- Contourne le rate-limit email en insérant directement dans auth.users

-- Extension pgcrypto pour bcrypt (activée par défaut dans Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Idempotent : ajoute name si la migration 006 n'a pas encore été jouée
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;

-- Fonction : créer un utilisateur par nom + mot de passe
--   - génère un email @abrane.internal
--   - hache le mot de passe en bcrypt
--   - insère dans auth.users avec email_confirmed_at = now() (pas besoin de confirmation)
--   - crée la ligne profiles
--   - retourne l'UUID du nouvel utilisateur
CREATE OR REPLACE FUNCTION public.create_user_by_name(p_name text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    uuid := gen_random_uuid();
  v_slug  text;
  v_email text;
BEGIN
  -- Génère un slug : minuscules, sans accents, caractères spéciaux → point
  v_slug := lower(p_name);
  v_slug := translate(v_slug,
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaaaceeeeiiiiðnoooooouuuuyyy');
  v_slug := regexp_replace(v_slug, '[^a-z0-9]', '.', 'g');
  v_slug := regexp_replace(v_slug, '\.+', '.', 'g');
  v_slug := trim(both '.' from v_slug);
  v_email := v_slug || '.' || to_hex(extract(epoch from now())::bigint) || '@abrane.internal';

  -- Vérifie que le nom n'est pas déjà pris
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(trim(name)) = lower(trim(p_name))) THEN
    RAISE EXCEPTION 'Un utilisateur avec ce nom existe déjà.';
  END IF;

  -- Insère dans auth.users (email confirmé d'emblée)
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now()
  );

  -- Crée le profil avec le nom affiché
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (v_id, v_email, p_name, 'user')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  RETURN v_id;
END;
$$;

-- Accessible aux utilisateurs non connectés (écran d'inscription)
GRANT EXECUTE ON FUNCTION public.create_user_by_name(text, text) TO anon, authenticated;
