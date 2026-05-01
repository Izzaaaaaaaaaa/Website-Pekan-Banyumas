-- Supabase schema for Kolaborator backend
-- Run in Supabase SQL Editor (public schema)

-- Enable UUID generation
create extension if not exists pgcrypto;

-- ===== users: add missing columns used by frontend =====
alter table public.users
  add column if not exists kota text,
  add column if not exists bio text,
  add column if not exists subsektor text[] default '{}',
  add column if not exists foto_url text,
  add column if not exists cover_url text,
  add column if not exists total_karya integer default 0,
  add column if not exists total_story integer default 0,
  add column if not exists total_event integer default 0;

-- ===== stories =====
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  konten text not null,
  media_url text,
  tags text[] default '{}',
  like_count integer default 0,
  status text default 'aktif',
  created_at timestamp without time zone default now()
);
create index if not exists idx_stories_user_id on public.stories(user_id);
create index if not exists idx_stories_created_at on public.stories(created_at desc);

-- ===== portfolios =====
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  judul text not null,
  subsektor text,
  deskripsi text,
  tahun integer,
  featured boolean default false,
  gambar_url text,
  created_at timestamp without time zone default now()
);
create index if not exists idx_portfolios_user_id on public.portfolios(user_id);
create index if not exists idx_portfolios_created_at on public.portfolios(created_at desc);

-- ===== event_requests =====
create table if not exists public.event_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  peran text default 'peserta',
  status text default 'pending',
  created_at timestamp without time zone default now()
);
create index if not exists idx_event_requests_user_id on public.event_requests(user_id);
create index if not exists idx_event_requests_event_id on public.event_requests(event_id);

-- ===== notifications =====
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text default 'system',
  title text,
  message text not null,
  read boolean default false,
  created_at timestamp without time zone default now()
);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
