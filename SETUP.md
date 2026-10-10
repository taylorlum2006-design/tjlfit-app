# Setup guide

The app runs in **preview mode** (sample data, stored only in your browser) until Supabase is connected. Do the Netlify part first to see it live, then connect Supabase.

## 1. Netlify (see the app live)

1. Go to netlify.com and sign up with GitHub.
2. **Add new site → Import an existing project → GitHub →** pick `tjlfit-app`.
3. Leave the build settings as they are (they come from `netlify.toml`) and click **Deploy**.
4. After about a minute you get a link like `something.netlify.app`. Open it on your phone. You can preview as a client or as the coach.

Rename the site in **Site configuration → Change site name** (e.g. `tjlfit`).

## 2. Supabase (real accounts and data)

1. Go to supabase.com, sign up with GitHub, click **New project**. Name it `tjlfit`, set a database password and save it somewhere safe, pick the region closest to most clients.
2. When it's ready, open **SQL Editor → New query**. Copy everything in `supabase/migrations/0001_init.sql`, paste it in, click **Run**. You should see "Success". Then do the same with `supabase/migrations/0002_calls_files.sql` (calls and files).
3. Open **Authentication → Sign In / Providers**. Make sure **Email** is on, and turn **Allow new users to sign up** off (clients only get in through your invite).
4. Open **Authentication → URL Configuration**. Set **Site URL** to your Netlify link (e.g. `https://tjlfit.netlify.app`) and add the same link under **Redirect URLs**.
5. Open **Project Settings → API**. You need three values: the **Project URL**, the **anon public** key, and the **service_role** key. Never paste these into chat.

## 3. Connect them

In Netlify: **Site configuration → Environment variables → Add a variable**. Add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `VITE_COACH_NAME` | Taylor |
| `VITE_BOOKING_LINK` | Your booking link, e.g. Calendly (optional, shows a "Book a call" button for clients) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com → API keys (turns on "Summarize with AI" for calls) |

Then **Deploys → Trigger deploy → Deploy site**. The app is now live with real logins.

## 4. Make the coach account

1. In Supabase: **Authentication → Users → Add user → Send invitation**, enter the coach email.
2. Open the email and click the link. You land in the app as a client.
3. In **SQL Editor**, run this (with the coach's email):

   ```sql
   update public.profiles set role = 'coach', name = 'Taylor' where email = 'coach@email.com';
   ```

4. Reload the app. You now see the coach dashboard and can invite clients from there.

## Calls and files

- **Calls** (coach view, inside a client): add upcoming calls with the meeting link, and past calls with the Fathom or Granola recording link. Paste the transcript and tap **Summarize with AI**, edit anything, then **Save and share summary** or keep it private. Transcripts and private notes are never visible to the client. **Add action items to their daily goals** drops them into the client's Goals checklist.
- **Files** (coach view, inside a client): upload PDFs up to 50 MB. Each file is either shared with the client (they see it under Files) or coach only.
- Each summary costs roughly a few cents on your Anthropic account.

## How changes work

Every push to the `main` branch on GitHub redeploys the app automatically. Client data lives in Supabase and is never touched by a redeploy.
