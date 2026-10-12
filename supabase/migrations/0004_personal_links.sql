-- TJL Fit: personal login links. Each person gets a private link that signs them in.
-- Only a fingerprint (hash) of each link is stored, never the link itself. Safe to run twice.
create table if not exists public.access_links (
  user_id uuid primary key references auth.users on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.access_links enable row level security;
-- No policies on purpose: only the app's server functions can read or write this table.
