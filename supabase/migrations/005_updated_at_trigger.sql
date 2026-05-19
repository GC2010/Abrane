-- ABRANE — Migration 005 : trigger updated_at + corrections

-- 1. S'assure que la colonne existe (idempotent, même si 004 a déjà été jouée)
alter table public.projects
  add column if not exists updated_at timestamp with time zone default now();

-- 2. Fonction trigger (réutilisable)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Trigger auto-update sur projects
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 4. Colonne updated_at sur templates aussi
alter table public.templates
  add column if not exists updated_at timestamp with time zone default now();

drop trigger if exists trg_templates_updated_at on public.templates;
create trigger trg_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();
