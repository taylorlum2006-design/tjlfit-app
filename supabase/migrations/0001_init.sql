-- TJL Fit: initial schema. Paste into Supabase > SQL Editor > New query > Run.
-- Safe to run once on a fresh project.

-- Profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'client' check (role in ('coach', 'client')),
  coach_id uuid references public.profiles(id),
  name text not null default '',
  email text not null default '',
  timezone text not null default 'UTC',
  units text not null default 'lbs' check (units in ('lbs', 'kg')),
  start_date date not null default current_date,
  daily_reminder_time text not null default '08:00',
  weekly_checkin_day int not null default 0,
  created_at timestamptz not null default now()
);

-- True when the signed-in user is the coach of the given client.
create or replace function public.is_coach_of(client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = client and coach_id = auth.uid());
$$;

-- New sign-ups (created by the invite function) get a profile automatically.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, coach_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'coach_id', '')::uuid
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy "read own or my clients" on public.profiles for select
  using (id = auth.uid() or coach_id = auth.uid());
create policy "update own" on public.profiles for update
  using (id = auth.uid() or coach_id = auth.uid());
-- Nobody can change their own role, coach or email from the app.
revoke update on public.profiles from authenticated;
grant update (name, timezone, units, daily_reminder_time, weekly_checkin_day, start_date) on public.profiles to authenticated;

-- Plans (written by the coach, read by the client) ---------------------------
create table public.plans (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  phase text not null default 'Phase 1',
  coach_note text not null default '',
  meals jsonb not null default '[]',
  supplements jsonb not null default '[]',
  goals jsonb not null default '[]',
  step_goal int not null default 10000,
  water_goal numeric not null default 3,
  photos_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy "client reads own plan" on public.plans for select
  using (client_id = auth.uid() or public.is_coach_of(client_id));
create policy "coach inserts plan" on public.plans for insert
  with check (public.is_coach_of(client_id));
create policy "coach updates plan" on public.plans for update
  using (public.is_coach_of(client_id));

-- Daily check-ins (one row per client per day) --------------------------------
create table public.daily_checkins (
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  weight numeric,
  rested boolean,
  train_desire int check (train_desire between 1 and 5),
  digestion text not null default '',
  untracked_food text not null default '',
  steps int,
  water numeric,
  goals_done jsonb not null default '[]',
  supplements_taken jsonb not null default '[]',
  submitted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (client_id, date)
);
alter table public.daily_checkins enable row level security;
create policy "read own or coach" on public.daily_checkins for select
  using (client_id = auth.uid() or public.is_coach_of(client_id));
create policy "client writes own" on public.daily_checkins for insert
  with check (client_id = auth.uid());
create policy "client updates own" on public.daily_checkins for update
  using (client_id = auth.uid());

-- Weekly check-ins -------------------------------------------------------------
create table public.weekly_checkins (
  client_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  weight numeric,
  body_fat numeric,
  energy int,
  sleep int,
  win text not null default '',
  improve text not null default '',
  notes text not null default '',
  prep jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (client_id, week_start)
);
alter table public.weekly_checkins enable row level security;
create policy "read own or coach" on public.weekly_checkins for select
  using (client_id = auth.uid() or public.is_coach_of(client_id));
create policy "client writes own" on public.weekly_checkins for insert
  with check (client_id = auth.uid());
create policy "client updates own" on public.weekly_checkins for update
  using (client_id = auth.uid());

-- Progress photos (files live in the private "photos" storage bucket) ----------
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  angle text not null check (angle in ('front', 'side', 'back')),
  storage_path text not null,
  created_at timestamptz not null default now()
);
alter table public.photos enable row level security;
create policy "read own or coach" on public.photos for select
  using (client_id = auth.uid() or public.is_coach_of(client_id));
create policy "client adds own" on public.photos for insert
  with check (client_id = auth.uid());
create policy "client deletes own" on public.photos for delete
  using (client_id = auth.uid());

insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;
create policy "client uploads own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "client and coach read photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_coach_of(((storage.foldername(name))[1])::uuid)
  ));
create policy "client deletes own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
