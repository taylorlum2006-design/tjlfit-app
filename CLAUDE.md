# TJL Fit Coaching App: Build Brief

This file is the source of truth for the project. Read it fully before writing code, and keep it updated as decisions get made.

## What we're building

A mobile-first coaching app (installable PWA) for TJL Fit clients, plus a coach dashboard. Clients log daily and weekly check-ins, follow their nutrition and supplement plan, log steps, upload progress photos, and see their weekly trends. The coach manages every client's plan from the browser, sees all data live, and turns call transcripts into summaries and action items.

Screenshots of the old version of the app are in `/reference`. Match its structure and content, not its bugs (listed below), and restyle it to the TJL brand.

The owner is not a developer. Explain setup steps click by click, never assume terminal knowledge beyond running commands you give, and never commit secrets.

## Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, Recharts for graphs
- **Hosting:** Netlify, auto-deploy from the GitHub `main` branch
- **Backend:** Supabase (Postgres, Auth with email magic links, private Storage for photos, Row Level Security on every table)
- **Server code:** Netlify Functions (anything needing a secret key) and Netlify Scheduled Functions (reminders, backups)
- **Push:** standard Web Push with VAPID keys, sent from Netlify functions
- **Email fallback:** Resend
- **AI summaries:** Anthropic API, called only from a Netlify function, key in Netlify env vars
- **Secrets:** `.env.local` for local dev (gitignored), Netlify environment variables for production. Provide a `.env.example`.

## Brand

Reference: the TJL Fit website. Pure black background, huge heavy condensed uppercase headlines in off-white with a soft white glow on the key line, clean sans body text in light grey, a faint constellation/particle line pattern in the background, and a gold italic serif used sparingly for emphasis words (e.g. "looks like."). Premium performance brand, not a SaaS dashboard.

- Background `#000000`, raised surfaces `#0F0F0F`, borders `#222222`
- Primary text `#F2F0EB`, secondary text `#A3A19B`
- Accent gold `#E8C25B` (slightly brighter than the website's muted gold). Used for progress, active states, chart lines, primary data numbers, and the italic serif emphasis. Keep it in one token.
- Primary buttons: off-white `#F2F0EB` fill with black text, rounded (like the website's "Book a call")
- Display font: Anton, uppercase, tight leading. Optional soft glow (text-shadow) on hero lines only
- Body font: Inter
- Emphasis font: Instrument Serif italic in gold, for one or two words per screen at most
- Logo: `/public/brand/TJL_LOGO.png` (white on black). Use on the loading screen (short logo reveal, respect reduced motion), in the app header, as the PWA app icon and splash, and in the coach dashboard.
- Subtle constellation background on the loading screen and login only, not behind data screens
- All brand values live in one place (`src/brand.ts` and CSS variables) so a rebrand is a few lines.
- UI copy: sentence case for body and buttons, plain verbs, no em dashes.
- Coach name default: Taylor (configurable)

## Users and access

- **Coach:** sees and edits all their clients. Can invite clients by email.
- **Client:** sees and edits only their own logs. Reads their own plan but cannot edit it.
- Enforce with Supabase RLS, not just the UI.

## Client app tabs

1. **Home:** today's daily check-in card, current macros with the coach's note, latest weight and change since start, today's goals (x/y), supplements (x/y), water vs goal, steps vs goal, banners for a missed daily check-in or a due weekly check-in.
2. **Daily check-in:** required: morning weight, woke up rested yes/no, training day yes/rest; desire to train 1-5 (required, only shown on training days). Optional: hunger yesterday 1-5, food eaten off plan (text). Digestion question removed (column kept for old data). Editable for today. One row per client per date.
3. **Goals:** daily checklist set by the coach, shown on the Progress page under the charts (`/goals` redirects to `/progress#goals`). Call action items can be added here.
4. **Workout:** TBD, waiting on screenshots.
5. **Progress:** weekly average weight graph and weekly average steps graph (week starts Monday, averages only over days actually logged), plus weekly check-in history.
6. **Nutrition:** daily targets, phase name, meal cards (name, timing note, per-meal macros, ingredients with grams and kcal), day total. Totals must be computed from the ingredients, never typed separately. Support alternate day types (e.g. a different meal set on specific weekdays) and multiple options for a meal.
7. **Supplements:** grouped by timing (with breakfast, post-workout, before bed, etc.), dose, coach note, tick-off per day.
8. **Steps:** today vs goal with progress bar, log input, 7-day average, goal hit x/7.
9. **Weekly check-in:** weight pre-filled from the 7-day average of daily logs (editable), body fat % optional, energy 1-10, sleep 1-10, win of the week, what to improve, how the week went, optional prep tracking section, link to photos.
10. **Photos:** front, side, back slots, date picker defaulting to today, consistency tip. Compress in the browser to about 1600px wide JPEG (~200 KB) before upload. Private bucket, signed URLs only. Side-by-side compare of two dates. Coach can turn photos off per client.
11. **Calls:** upcoming call (time, meeting link, coach booking link), past calls with recording link and the client-visible summary and action items. Visibility of summaries is a coach setting per call.
12. **Me:** name, units (lbs/kg), time zone, notification settings, install-app instructions.

Menu items: Home, Check-in, Nutrition, Progress & goals, Supplements, Steps, Photos, Calls & files (`/files` redirects to `/calls`), Me.

Navigation: a menu button in the top right of the header (shows the current page name) that drops down a list of every section. No bottom bar. No clipped or crammed labels.

## Coach dashboard

- Client list with last check-in date, missed check-ins flagged, weight trend arrow, steps average
- Client detail: all tabs read-only plus edit mode for plan (macros, meals, supplements, goals, notes, step and water goals)
- Calls: create a call, paste a Fathom or Granola transcript, click Summarize. Output: main summary, key decisions, wins, concerns, action items. Coach can edit before saving, toggle client visibility, and push action items into the client's Goals.
- Private coach notes per call and per client, stored in a separate table the client can never read
- Later: optional Fathom webhook to import transcripts automatically

## Notifications

- Client installs the PWA and allows notifications (show clear iPhone "Add to Home Screen" steps; push only works on iOS from the installed app, iOS 16.4+)
- Netlify Scheduled Function runs hourly and checks each client's local time:
  - Daily reminder at their chosen time (default 8:00) if today's daily check-in is missing
  - Weekly reminder on their check-in day (default Sunday 18:00) if the weekly check-in is missing
- Email fallback via Resend for clients without push enabled
- Never send a reminder for something already logged

## Data model (starting point, adjust as needed)

- `profiles`: id, role (coach/client), coach_id, name, email, timezone, units, reminder settings, start_date, photos_enabled
- `plans`: client_id, macros, phase, meals (jsonb), supplements (jsonb), goals (jsonb), step_goal, water_goal, coach_note, updated_at
- `daily_checkins`: client_id, date, weight, rested, train_desire, digestion, untracked_food, steps, water, goals_done (jsonb), supplements_taken (jsonb), unique (client_id, date)
- `weekly_checkins`: client_id, week_start, weight, body_fat, energy, sleep, win, improve, notes, prep (jsonb)
- `photos`: client_id, date, angle, storage_path
- `calls`: client_id, scheduled_at, meeting_link, recording_link, transcript, summary (jsonb), client_visible
- `coach_notes`: client_id, call_id (nullable), body (coach-only RLS)
- `push_subscriptions`: user_id, subscription (jsonb)

Schema changes after launch go through migrations that preserve existing data. Never drop or recreate tables holding client data.

## Backups

Weekly Netlify Scheduled Function exports all tables to JSON (plus photo files) into the owner's Google Drive folder via a Google service account. Give the owner step-by-step instructions to create the service account and share the folder with it.

## Known bugs from the old app to avoid

- Daily weight logged but Home said "No check-ins yet": every card must read from the same data
- Raw `’` showing in text
- Weekly weight placeholder in kg while the field is lbs
- Protein target mismatch between pages (180 g vs 197 g): one source of truth per number
- Same food listed in a meal and again as a supplement, double counting
- Nav labels jammed together and the last tab clipped

## Build phases

1. **Setup:** repo, Vite app, Tailwind, brand tokens, Supabase project and schema with RLS, auth, Netlify deploy. Walk the owner through each account step.
2. **Core client app + coach plan editor + graphs**, loading screen and logo.
3. **PWA install + push + email reminders + time zones.**
4. **Calls section + AI summaries.**
5. **Backups, privacy policy page, polish.**

At the end of each phase: run it, test it at phone width, fix issues, commit, deploy, and give the owner a short list of what to try.

## Open decisions (ask the owner when you reach them)

- Coach name shown in the app
- Workout tab content (waiting on screenshots, also Goals, Progress, and the cut-off tab)
- Domain (e.g. app.tjlfit.com)

## Status

- **Done (Phase 1 + most of 2):** Vite/React app, brand tokens (`src/brand.ts`, CSS variables in `src/index.css`), self-hosted fonts, logo splash, magic-link login, client tabs (Home, Check-in daily/weekly, Nutrition with day variants and pick-one meals, Progress with weekly average weight and steps charts, Goals, Supplements, Steps, Photos with compare, Me), coach dashboard (client list with flags, client detail with overview, check-ins, plan editor, photos), invite function, Supabase schema with RLS (`supabase/migrations/0001_init.sql`), preview mode when no Supabase keys are set (`src/data/demo.ts`). Setup steps for the owner are in `SETUP.md`.
- **Done (Phase 4):** Calls (`calls` client-visible table + coach-only `call_private` for transcript, notes, draft summary; summary copied to `calls.summary` only when shared), AI summaries via `netlify/functions/summarize-call.mjs` (model from `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`), action items to Goals, client Calls page with next call and booking link (`VITE_BOOKING_LINK`). Files: per-client PDFs in private `documents` bucket, shared or coach only (`supabase/migrations/0002_calls_files.sql`). Navigation is a top-right dropdown.
- **Access:** clients never see coach UI. Sign-in is a 6-digit email code (`verifyOtp`, works in the iOS home-screen app) shown only once per device; sessions persist. Coach dashboard lives at `/coach`. Preview mode has no sign-in: `/` is the sample client, `/coach` is the coach. Daily greeting screen (`src/components/Greeting.tsx`) shows on first open each day.
- **Launch prep:** `remove-client` Netlify function (coach-only, empties photos/documents folders, deletes auth user, rows cascade) with a Remove button on the coach Overview tab; time zone auto-set from the device on first live sign-in; sign-in code accepts 6 to 10 digits; `supabase/setup-all.sql` = 0001 + 0002 in one paste; SETUP.md is now a go-live checklist (custom SMTP required for client emails).
- **Migrations:** `0003_checkin_questions.sql` adds `training_day` and `hunger` (also appended to `setup-all.sql`). Run new migrations on the live database before or right after deploying.
- **Next:** Workout tab (waiting on screenshots), Phase 3 reminders, Phase 5 backups, optional Fathom webhook import.
