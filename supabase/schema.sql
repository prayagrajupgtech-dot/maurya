-- Supabase Database Schema for QR and ID Card Generator

-- 1. ID Cards Table
create table if not exists public.id_cards (
  id uuid primary key default gen_random_uuid(),
  card_number text unique not null,
  name text not null,
  phone text not null,
  date_of_birth date not null,
  edit_token_hash text not null,
  address text not null,
  photo_url text,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'blocked')),
  created_at timestamptz not null default now()
);

create index if not exists id_cards_card_number_idx
  on public.id_cards(card_number);

alter table public.id_cards enable row level security;
revoke all on public.id_cards from anon, authenticated;
grant select, insert, update on public.id_cards to service_role;

-- 2. Subscriptions Table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  razorpay_subscription_id text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null,
  trial_ends_at timestamptz not null,
  current_start_at timestamptz,
  current_end_at timestamptz,
  paid_count integer not null default 0,
  remaining_count integer not null default 60,
  last_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_email_idx
  on public.subscriptions(customer_email);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select, insert, update on public.subscriptions to service_role;

-- 3. Razorpay Webhook Events Log Table
create table if not exists public.razorpay_events (
  event_id text primary key,
  event_type text not null,
  razorpay_subscription_id text,
  processed_at timestamptz not null default now()
);

alter table public.razorpay_events enable row level security;
revoke all on public.razorpay_events from anon, authenticated;
grant select, insert on public.razorpay_events to service_role;

-- 4. Email Verifications Table (OTP)
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  created_at timestamptz not null default now()
);

create index if not exists email_verifications_email_idx
  on public.email_verifications(email);

alter table public.email_verifications enable row level security;
revoke all on public.email_verifications from anon, authenticated;
grant select, insert, update on public.email_verifications to service_role;

-- 5. User Profiles Table (links Supabase Auth to application data)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx
  on public.user_profiles(email);

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon, authenticated;
grant select, insert, update on public.user_profiles to service_role;
