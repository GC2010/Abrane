-- ABRANE — Migration 004 : colonne updated_at sur projects
alter table public.projects
  add column if not exists updated_at timestamp with time zone default now();
