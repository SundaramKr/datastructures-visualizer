-- Migration: Add session tokens for API authentication
-- Apply in Supabase SQL Editor AFTER schema.sql

-- Session tokens table
create table if not exists public.session_tokens (
  token text primary key,
  user_email text not null references public.users(email) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

-- Index for fast lookup by user_email (cleanup queries)
create index if not exists idx_session_tokens_user_email
  on public.session_tokens(user_email);

-- Index for expiry cleanup
create index if not exists idx_session_tokens_expires_at
  on public.session_tokens(expires_at);

-- RLS: only service role should access this table
alter table public.session_tokens enable row level security;

-- Function to validate a session token and return the user email
create or replace function public.validate_session(session_token text)
returns text
language sql
security definer
as $$
  select user_email
  from public.session_tokens
  where token = session_token
    and expires_at > now()
  limit 1;
$$;

-- Function to create a session token (returns the token string)
create or replace function public.create_session(p_user_email text, p_token text)
returns void
language sql
security definer
as $$
  -- Clean up expired tokens for this user first
  delete from public.session_tokens
  where user_email = p_user_email and expires_at <= now();

  -- Insert the new token
  insert into public.session_tokens (token, user_email)
  values (p_token, p_user_email);
$$;

-- Function to revoke a session token (for logout)
create or replace function public.revoke_session(session_token text)
returns void
language sql
security definer
as $$
  delete from public.session_tokens where token = session_token;
$$;
