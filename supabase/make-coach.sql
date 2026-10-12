-- TJL Fit: turn your account into the coach account and get your personal coach link.
-- 1. First create your user: Supabase > Authentication > Users > Add user > Create new user
--    (your email, any password, tick "Auto Confirm User").
-- 2. Replace YOUR_EMAIL_HERE below with that email, paste everything into SQL Editor, Run.
-- 3. Copy the link it shows. Running this again makes a new link and the old one stops working.

create table if not exists public.access_links (
  user_id uuid primary key references auth.users on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table public.access_links enable row level security;

with t as (select encode(extensions.gen_random_bytes(24), 'hex') as tok),
coach as (
  update public.profiles set role = 'coach', name = 'Taylor'
  where lower(email) = lower('YOUR_EMAIL_HERE')
  returning id
),
saved as (
  insert into public.access_links (user_id, token_hash)
  select coach.id, encode(extensions.digest(t.tok, 'sha256'), 'hex') from coach, t
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now()
  returning user_id
)
select 'https://tjlfitapp.netlify.app/c/' || t.tok || '/coach' as your_coach_link from t, saved;
