-- Add an optional parent or guardian contact number to card applications.
alter table public.card_applications
  add column if not exists parent_phone text;
