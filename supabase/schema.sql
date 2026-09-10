-- Supabase Database Schema for QR and ID Card Generator (Admin + User Architecture)

-- 1. Plans Table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0,
  duration_days integer not null default 30,
  card_limit integer not null default 100, -- -1 for unlimited
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;
revoke all on public.plans from anon, authenticated;
grant select, insert, update, delete on public.plans to service_role;

-- Default Plans Seed (insert if not exists)
insert into public.plans (id, name, price, duration_days, card_limit, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Basic', 499.00, 30, 100, 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Standard', 999.00, 90, 300, 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Premium', 1999.00, 365, -1, 'active')
on conflict (id) do nothing;

-- 2. User Profiles Table (links Auth / Local users to application data)
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  phone text,
  password_hash text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'blocked', 'deleted')),
  plan_id uuid references public.plans(id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles(email);
create index if not exists user_profiles_role_idx on public.user_profiles(role);

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon, authenticated;
grant select, insert, update, delete on public.user_profiles to service_role;

-- 3. ID Cards Table
create table if not exists public.id_cards (
  id uuid primary key default gen_random_uuid(),
  card_number text unique not null,
  name text not null,
  phone text not null,
  date_of_birth date not null,
  edit_token_hash text not null,
  address text not null,
  photo_url text,
  user_id uuid references public.user_profiles(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'expired', 'blocked')),
  created_at timestamptz not null default now()
);

create index if not exists id_cards_card_number_idx on public.id_cards(card_number);
create index if not exists id_cards_user_id_idx on public.id_cards(user_id);

alter table public.id_cards enable row level security;
revoke all on public.id_cards from anon, authenticated;
grant select, insert, update, delete on public.id_cards to service_role;

-- 4. Admin Activity Logs Table
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  admin_id text not null,
  target_user_id text,
  details text,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_logs enable row level security;
revoke all on public.admin_activity_logs from anon, authenticated;
grant select, insert, update, delete on public.admin_activity_logs to service_role;

-- 5. Subscriptions Table (Razorpay legacy link)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  razorpay_subscription_id text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  user_id uuid references public.user_profiles(id) on delete set null,
  password_hash text,
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

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select, insert, update to service_role;

-- 6. Email Verifications Table (OTP)
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

alter table public.email_verifications enable row level security;
revoke all on public.email_verifications from anon, authenticated;
grant select, insert, update to service_role;
