-- ABRANE — Migration 007 : création d'utilisateur sans email ni pgcrypto
-- Le hash bcrypt est calculé côté JS (bcryptjs) et passé déjà hashé à la fonction.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;

CREATE OR REPLACE FUNCTION public.create_user_by_name(p_name text, p_encrypted_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_id    uuid := gen_random_uuid();
  v_slug  text;
  v_email text;
BEGIN
  v_slug := lower(p_name);
  v_slug := translate(v_slug,
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaaaceeeeiiiiðnoooooouuuuyyy');
  v_slug := regexp_replace(v_slug, '[^a-z0-9]', '.', 'g');
  v_slug := regexp_replace(v_slug, '\.+', '.', 'g');
  v_slug := trim(both '.' from v_slug);
  v_email := v_slug || '.' || to_hex(extract(epoch from now())::bigint) || '@abrane.internal';

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(trim(name)) = lower(trim(p_name))) THEN
    RAISE EXCEPTION 'Un utilisateur avec ce nom existe déjà.';
  END IF;

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
    p_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now()
  );

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (v_id, v_email, p_name, 'user')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  RETURN v_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.create_user_by_name(text, text) TO anon, authenticated;
