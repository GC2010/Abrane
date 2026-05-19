-- ─────────────────────────────────────────────────────────────
-- ABRANE — Migration 002 : trigger auto-création profil
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- Crée automatiquement une ligne dans profiles à chaque
-- nouvel utilisateur Supabase Auth (évite l'erreur RLS à l'insert)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Promouvoir en superadmin après création ───────────────────
-- À exécuter APRÈS avoir créé l'utilisateur dans Auth :
--
--   update public.profiles
--   set role = 'superadmin'
--   where email = 'admin@abrane.com';
