create table if not exists public.id_cards (
  id uuid primary key default gen_random_uuid(),
  card_number text unique not null,
  name text not null,
  phone text not null,
  date_of_birth date not null,
  edit_token_hash text not null,
  address text not null,
  photo_url text,
  status text not null default 'active'
    check (status in ('active', 'expired', 'blocked')),
  created_at timestamptz not null default now()
);

alter table public.id_cards
  add column if not exists edit_token_hash text;

alter table public.id_cards
  alter column edit_token_hash set not null;

create index if not exists id_cards_card_number_idx
  on public.id_cards(card_number);

alter table public.id_cards enable row level security;

revoke all on public.id_cards from anon, authenticated;
grant select, insert, update on public.id_cards to service_role;
