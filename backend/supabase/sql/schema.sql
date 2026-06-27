-- Whiteboard login: one row per BMSCE email.
-- Apply in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  email text primary key,
  name text,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "anon read users" on public.users;
drop policy if exists "anon write users" on public.users;
