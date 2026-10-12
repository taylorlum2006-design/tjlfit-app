# Go-live guide

Netlify is already done (the app is live at `tjlfitapp.netlify.app` in preview mode with sample data). These steps switch it to real accounts. Total time: about 30 minutes.

Never paste passwords or keys into a chat. They only go into Supabase and Netlify.

## 1. Create the database (Supabase, 10 min)

1. Go to **supabase.com**, sign up with GitHub, click **New project**. Name it `tjlfit`, set a database password (save it in your password manager), and pick the region closest to most clients. Wait for it to finish setting up.
2. Open **SQL Editor → New query**. Open `supabase/setup-all.sql` from the GitHub repo, copy all of it, paste it in, click **Run**. You should see "Success. No rows returned".
3. **Authentication → Sign In / Providers → Email:** make sure Email is on. Turn **Allow new users to sign up** off (clients can only get in through your invite).
4. **Authentication → URL Configuration:** set **Site URL** to `https://tjlfitapp.netlify.app` and add the same link under **Redirect URLs**.

## 2. Let the app send emails (5 min)

Supabase's built-in email only sends to people on your Supabase team, a couple per hour. Clients wouldn't get their invites or sign-in codes. Connect your own email:

**Easiest: a Gmail account** (no domain needed, up to ~500 emails a day)

1. On that Google account, turn on **2-Step Verification**, then go to **myaccount.google.com/apppasswords** and create an app password called "TJL Fit". Copy the 16-character password.
2. In Supabase: **Authentication → Emails → SMTP Settings**, turn on **Enable custom SMTP** and fill in:
   - Sender email: the Gmail address. Sender name: `TJL Fit`
   - Host: `smtp.gmail.com`. Port: `587`
   - Username: the Gmail address. Password: the app password
3. Save.

(If you own a domain like tjlfit.com, Resend is the more professional option: emails come from `hello@tjlfit.com`. Ask and I'll walk you through it.)

## 3. Set the email messages (3 min)

In **Authentication → Emails → Templates**:

**Invite user** (what a new client receives). Subject: `Your TJL Fit app is ready`

```html
<h2>Your TJL Fit app is ready</h2>
<p><a href="{{ .ConfirmationURL }}">Tap here to open your plan.</a></p>
<p><strong>On iPhone:</strong> once it opens in Safari, tap the Share button, then <strong>Add to Home Screen</strong>. Open the app from your home screen and sign in with this email address. You'll get a code to type in, then you're in for good.</p>
```

**Magic Link** (the sign-in code). Subject: `Your TJL Fit sign-in code`

```html
<h2>Your TJL Fit sign-in code</h2>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Or tap <a href="{{ .ConfirmationURL }}">this link</a> to sign in on this device.</p>
```

## 4. Connect the app to the database (5 min)

1. In Supabase: **Project Settings → API Keys**. You need the **Project URL** (under Project Settings → Data API if it's not on that page), the **publishable** key (older projects call it **anon**), and the **secret** key (older projects call it **service_role**).
2. In Netlify: **Project configuration → Environment variables → Add a variable**, one at a time:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key. Keep this private. |
| `VITE_COACH_NAME` | Taylor |
| `VITE_BOOKING_LINK` | Your booking link, e.g. Calendly (optional) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com → API keys (for call summaries, optional) |

3. **Deploys → Trigger deploy → Deploy project.** After a minute the sample data is gone and the app shows a sign-in screen.

## 5. Make your coach account (2 min)

1. In Supabase: **Authentication → Users → Add user → Send invitation**, enter your own email.
2. In **SQL Editor**, run this with your email:

   ```sql
   update public.profiles set role = 'coach', name = 'Taylor' where email = 'you@email.com';
   ```

3. Go to `tjlfitapp.netlify.app/coach`, enter your email, type the code from your inbox. You're in the coach dashboard.

## 6. Test it as a client yourself

1. In the coach dashboard, invite yourself as a client using a second email. With Gmail you can use a `+` address that lands in the same inbox, e.g. `yourname+test@gmail.com`.
2. On your phone, open the invite email, add the app to your home screen, open it, sign in with the `+test` address and the code.
3. Try it: log a daily check-in, steps, water, a photo, a weekly check-in.
4. Back in the coach dashboard, open the test client: check the data shows up, edit the plan, add a call, upload a file. Reopen the phone app and check the changes appear.
5. Delete the test client: open them, **Overview** tab, scroll down, **Remove client and delete all their data**, type DELETE. Everything about them is wiped.

## 7. Invite your real clients

Coach dashboard → **Invite a client** → name and email. They get the invite email, add the app to their home screen, sign in once, and from then on it opens straight to their plan. Build each client's plan in their **Plan** tab.

---

## Day to day

- **What clients see:** only the client app. If they type `/coach` they're sent back to their plan, and the database blocks them from anyone else's data.
- **Calls:** inside a client, add calls with the meeting link and Fathom/Granola recording link. Paste the transcript, tap **Summarize with AI**, edit, then share it or keep it private. Transcripts and private notes are never visible to the client.
- **Files:** inside a client, upload PDFs up to 50 MB, shared or coach only.
- **Removing a client:** Overview tab → Remove client. Permanent.
- **Changes to the app:** every push to `main` on GitHub redeploys automatically in about a minute. Client data lives in Supabase and is never touched by a redeploy.
