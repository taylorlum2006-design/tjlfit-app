-- TJL Fit: daily check-in v2. Adds "training day?" and "hunger". Safe to run on a live database.
alter table public.daily_checkins add column if not exists training_day boolean;
alter table public.daily_checkins add column if not exists hunger int check (hunger between 1 and 5);
