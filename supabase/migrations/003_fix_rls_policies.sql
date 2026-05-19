-- ─────────────────────────────────────────────────────────────
-- ABRANE — Migration 003 : fix RLS infinite recursion
-- Problème : les policies "admin" font un SELECT sur profiles
-- depuis une policy sur profiles → boucle infinie.
-- Solution : fonction security definer qui bypass le RLS.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Fonction helper (s'exécute SANS RLS) ──────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;


-- ── 2. Fix policies profiles ──────────────────────────────────
drop policy if exists "profiles: admin lit tout" on public.profiles;

-- Plus besoin d'une policy admin séparée :
-- is_admin() bypass le RLS donc pas de récursion
create policy "profiles: admin lit tout"
  on public.profiles for select
  using ( auth.uid() = id OR is_admin() );


-- ── 3. Fix policies templates ─────────────────────────────────
drop policy if exists "templates: écriture admin" on public.templates;
drop policy if exists "templates: mise à jour admin" on public.templates;
drop policy if exists "templates: suppression admin" on public.templates;

create policy "templates: écriture admin"
  on public.templates for insert
  with check ( is_admin() );

create policy "templates: mise à jour admin"
  on public.templates for update
  using ( is_admin() );

create policy "templates: suppression admin"
  on public.templates for delete
  using ( is_admin() );


-- ── 4. Fix policies projects ──────────────────────────────────
drop policy if exists "projects: admin lit tout" on public.projects;

create policy "projects: admin lit tout"
  on public.projects for select
  using ( auth.uid() = user_id OR is_admin() );


-- ── 5. Fix policies assets ───────────────────────────────────
drop policy if exists "assets: écriture admin" on public.assets;

create policy "assets: écriture admin"
  on public.assets for all
  using ( is_admin() );


-- ── 6. Fix policy storage upload ────────────────────────────
drop policy if exists "storage: upload admin" on storage.objects;

create policy "storage: upload admin"
  on storage.objects for insert
  with check (
    bucket_id = 'abrane-assets'
    and is_admin()
  );
