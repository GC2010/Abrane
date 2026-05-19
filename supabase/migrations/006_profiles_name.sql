-- ABRANE — Migration 006 : colonne name + fonctions login par nom

-- 1. Colonne name sur profiles
alter table public.profiles
  add column if not exists name text;

-- 2. Fonction publique : liste des utilisateurs (login screen)
--    Security definer → bypass RLS, expose uniquement id + name
create or replace function public.list_users()
returns table(id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name
  from public.profiles
  where name is not null and name <> ''
  order by name;
$$;

-- 3. Fonction publique : retrouver l'email interne par le nom
--    Utilisé pour login sans email (nom → email @abrane.internal)
create or replace function public.get_email_by_name(p_name text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email
  from public.profiles
  where lower(trim(name)) = lower(trim(p_name))
  limit 1;
$$;

-- 4. Mettre à jour le nom de l'admin existant si absent
update public.profiles
  set name = 'Administrateur ABRANE'
  where email = 'admin@abrane.com' and (name is null or name = '');
