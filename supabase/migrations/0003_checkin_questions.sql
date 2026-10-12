-- TJL Fit: daily check-in v2. Adds "scheduled to train today?" and "energy levels today". Safe to run on a live database, and safe to run twice.
alter table public.daily_checkins add column if not exists training_day boolean;
alter table public.daily_checkins add column if not exists energy int check (energy between 1 and 5);
