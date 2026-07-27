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

-- Presentations table for Google Slides integration
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(email) on delete cascade,
  title text not null,
  description text,
  google_slides_url text not null,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Slide configurations for linking visualizers to specific Google Slides
create table if not exists public.slide_configs (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references public.presentations(id) on delete cascade,
  slide_number int not null,
  visualizer_type text, -- 'array' or 'linkedlist'
  visualizer_config jsonb, -- stores initial values, capacity, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(presentation_id, slide_number)
);

-- RLS policies for presentations
alter table public.presentations enable row level security;

-- Users can read their own presentations
create policy "users read own presentations" on public.presentations
  for select using (auth.uid()::text = user_id);

-- Users can insert their own presentations
create policy "users insert own presentations" on public.presentations
  for insert with check (auth.uid()::text = user_id);

-- Users can update their own presentations
create policy "users update own presentations" on public.presentations
  for update using (auth.uid()::text = user_id);

-- Users can delete their own presentations
create policy "users delete own presentations" on public.presentations
  for delete using (auth.uid()::text = user_id);

-- Public can read presentations by share token (via function)
create policy "anon read by share token" on public.presentations
  for select using (true);

-- RLS policies for slide_configs
alter table public.slide_configs enable row level security;

-- Users can read slide configs for their presentations
create policy "users read own slide configs" on public.slide_configs
  for select using (
    exists (
      select 1 from public.presentations 
      where presentations.id = slide_configs.presentation_id 
      and presentations.user_id = auth.uid()::text
    )
  );

-- Users can insert slide configs for their presentations
create policy "users insert own slide configs" on public.slide_configs
  for insert with check (
    exists (
      select 1 from public.presentations 
      where presentations.id = slide_configs.presentation_id 
      and presentations.user_id = auth.uid()::text
    )
  );

-- Users can update slide configs for their presentations
create policy "users update own slide configs" on public.slide_configs
  for update using (
    exists (
      select 1 from public.presentations 
      where presentations.id = slide_configs.presentation_id 
      and presentations.user_id = auth.uid()::text
    )
  );

-- Users can delete slide configs for their presentations
create policy "users delete own slide configs" on public.slide_configs
  for delete using (
    exists (
      select 1 from public.presentations 
      where presentations.id = slide_configs.presentation_id 
      and presentations.user_id = auth.uid()::text
    )
  );

-- Public can read slide configs for shared presentations
create policy "anon read slide configs" on public.slide_configs
  for select using (true);

-- Function to get presentation by share token
create or replace function public.get_presentation_by_token(token text)
returns json
language sql
security definer
as $$
  select json_build_object(
    'id', id,
    'title', title,
    'description', description,
    'google_slides_url', google_slides_url,
    'slide_configs', (
      select json_agg(json_build_object(
        'slide_number', slide_number,
        'visualizer_type', visualizer_type,
        'visualizer_config', visualizer_config
      ))
      from public.slide_configs
      where slide_configs.presentation_id = presentations.id
    )
  )
  from public.presentations
  where share_token = token
  limit 1;
$$;

-- Function to get user's presentations
create or replace function public.get_user_presentations(user_email text)
returns json
language sql
security definer
as $$
  select json_agg(json_build_object(
    'id', id,
    'title', title,
    'description', description,
    'google_slides_url', google_slides_url,
    'share_token', share_token,
    'created_at', created_at,
    'updated_at', updated_at,
    'slide_configs', (
      select json_agg(json_build_object(
        'slide_number', slide_number,
        'visualizer_type', visualizer_type,
        'visualizer_config', visualizer_config
      ))
      from public.slide_configs
      where slide_configs.presentation_id = ordered_presentations.id
    )
  ))
  from (
    select *
    from public.presentations
    where user_id = user_email
    order by created_at desc
  ) as ordered_presentations;
$$;
