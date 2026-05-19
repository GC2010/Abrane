-- ─────────────────────────────────────────────
-- ABRANE — Migration 001 : tables initiales
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────

-- ── 1. profiles ──────────────────────────────
create table if not exists public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text,
  role      text not null default 'user',  -- 'user' | 'admin' | 'superadmin'
  firma_url text
);

alter table public.profiles enable row level security;

-- Chaque utilisateur lit son propre profil
create policy "profiles: lecture propre"
  on public.profiles for select
  using (auth.uid() = id);

-- Chaque utilisateur met à jour son propre profil
create policy "profiles: mise à jour propre"
  on public.profiles for update
  using (auth.uid() = id);

-- L'admin lit tous les profils
create policy "profiles: admin lit tout"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );


-- ── 2. templates ─────────────────────────────
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  data        jsonb not null default '{}',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamp with time zone default now()
);

alter table public.templates enable row level security;

-- Tout le monde lit les templates
create policy "templates: lecture publique"
  on public.templates for select
  using (true);

-- Seul l'admin peut créer / modifier / supprimer
create policy "templates: écriture admin"
  on public.templates for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );

create policy "templates: mise à jour admin"
  on public.templates for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );

create policy "templates: suppression admin"
  on public.templates for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );


-- ── 3. projects ──────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  user_id     uuid references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  data        jsonb not null default '{}',
  created_at  timestamp with time zone default now()
);

alter table public.projects enable row level security;

-- Chaque utilisateur lit et modifie ses propres projets
create policy "projects: lecture propre"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects: insertion propre"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects: mise à jour propre"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "projects: suppression propre"
  on public.projects for delete
  using (auth.uid() = user_id);

-- L'admin lit tous les projets
create policy "projects: admin lit tout"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );


-- ── 4. assets (logos boutiques + filigrane) ──
create table if not exists public.assets (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,   -- ex: 'logo_SANDRO', 'wm_abrane', 'logo_official'
  url        text not null,          -- URL Supabase Storage
  created_at timestamp with time zone default now()
);

alter table public.assets enable row level security;

-- Lecture publique (logos visibles par tous)
create policy "assets: lecture publique"
  on public.assets for select
  using (true);

-- Écriture admin uniquement
create policy "assets: écriture admin"
  on public.assets for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );


-- ── 5. Storage bucket pour les logos ─────────
insert into storage.buckets (id, name, public)
values ('abrane-assets', 'abrane-assets', true)
on conflict (id) do nothing;

-- Lecture publique du bucket
create policy "storage: lecture publique"
  on storage.objects for select
  using (bucket_id = 'abrane-assets');

-- Upload admin uniquement
create policy "storage: upload admin"
  on storage.objects for insert
  with check (
    bucket_id = 'abrane-assets'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','superadmin')
    )
  );
