# Go-live guide

Netlify is already done (the app is live at `tjlfitapp.netlify.app` in preview mode with sample data). These steps switch it to real accounts. Total time: about 20 minutes. No email setup needed: everyone signs in with a personal link.

Never paste passwords or keys into a chat. They only go into Supabase and Netlify.

## 1. Create the database (Supabase, 10 min)

1. Go to **supabase.com**, sign up with GitHub, click **New project**. Name it `tjlfit`, set a database password (save it in your password manager), and pick the region closest to most clients. Wait for it to finish setting up.
2. Open **SQL Editor → New query**. Open `supabase/setup-all.sql` from the GitHub repo, copy all of it, paste it in, click **Run**. You should see "Success. No rows returned".
3. **Authentication → Sign In / Providers:** turn **Allow new users to sign up** off.
4. **Authentication → URL Configuration:** set **Site URL** to `https://tjlfitapp.netlify.app` and add the same link under **Redirect URLs**.

## 2. Connect the app to the database (5 min)

1. In Supabase: **Project Settings → API Keys**. You need the **Project URL** (under Project Settings → Data API if it's not on that page), the **publishable** key (older projects call it **anon**), and the **secret** key (older projects call it **service_role**).
2. In Netlify: **Project configuration → Environment variables → Add a variable**, one at a time:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key. Keep this private. |
| `VITE_COACH_NAME` | Taylor |
| `VITE_BOOKING_LINK` | Your booking link, e.g. Calendly (optional) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com → API keys. Powers "Process call". Tick **Contains secret values**. |

3. **Deploys → Trigger deploy → Deploy project.** After a minute the sample data is gone.

## 3. Make your coach account (3 min)

1. In Supabase: **Authentication → Users → Add user → Create new user**. Enter your email and any password (you won't use it), tick **Auto Confirm User**, click **Create user**.
2. Open **SQL Editor → New query**, paste everything from `supabase/make-coach.sql`, replace `YOUR_EMAIL_HERE` with your email, click **Run**.
3. It shows **your_coach_link**. Copy it and save it somewhere safe (bookmark it, and add it to your phone's home screen). That link is your login to the coach dashboard.

## 4. Test it as a client yourself

1. Open your coach link. Under **Add a client**, add yourself with a name like "Test client" (email optional) and tap **Add client and get their link**.
2. Copy the link, open it on your phone, add it to your home screen, open the app from the icon.
3. Try it: daily check-in, steps, water, a photo, a weekly check-in.
4. In the coach dashboard, open the test client: check the data shows up, edit the plan, add a call, upload a file. Reopen the phone app and check the changes appear.
5. Delete the test client: open them, **Overview** tab, scroll down, **Remove client and delete all their data**, type DELETE.

## 5. Add your real clients

Coach dashboard → **Add a client** → name (email optional) → **Copy message** → send it to them on WhatsApp, Instagram or text. They tap the link, add it to their home screen, done. Nothing is emailed, there are no passwords. Build each client's plan in their **Plan** tab.

Lost link, or worried someone else has it? Open the client → Overview → **Make a new link**. The old one stops working.

---

## Day to day

- **What clients see:** only the client app, through their personal link. If they type `/coach` they're sent back to their plan, and the database blocks them from anyone else's data.
- **Calls:** inside a client, Calls tab → **New call from Fathom** → upload or paste the transcript → **Process call**. In about a minute it updates their plan (meals, macros, supplements, step and water targets, coach note), writes the recap and shares it, and shows you what changed with an **Undo** button. Transcripts and private notes are never visible to the client. Use **Schedule an upcoming call** for future calls with a meeting link.
- **Files:** inside a client, upload PDFs up to 50 MB, shared or coach only.
- **Removing a client:** Overview tab → Remove client. Permanent.
- **Changes to the app:** every push to `main` on GitHub redeploys automatically in about a minute. Client data lives in Supabase and is never touched by a redeploy.
