# Auth emails (confirmation & password reset)

The signup **confirmation** and **password reset** emails are generated and sent
by **Supabase**, not by the Tuvoria app. If they aren't arriving, the fix is in
your Supabase project settings — the app code (`signUpAction`,
`/auth/callback`) is working correctly.

## Why confirmation emails often don't arrive

Supabase's **built-in email service is for testing only**. It is heavily
rate-limited (as few as ~2–4 emails per hour on the free tier) and is frequently
dropped or spam-filtered by Gmail/Outlook. Once the hourly limit is hit, further
signups silently send nothing. **The real fix is to configure your own SMTP.**

## Fix checklist (hosted Supabase dashboard)

1. **Enable custom SMTP** — Authentication → **Emails → SMTP Settings** → turn on
   *Enable Custom SMTP*. Use a transactional provider (Resend, Postmark, Amazon
   SES, SendGrid, Mailgun). Fill in host, port (587), username, password, and a
   **sender address on a domain you've verified** (e.g. `no-reply@tuvoria.app`).
   Emails from an unverified domain get dropped.

2. **Verify your sending domain** — add the provider's **SPF + DKIM** DNS
   records for `tuvoria.app`. Without these, most inboxes reject or spam the mail.

3. **Confirm the flow is on** — Authentication → **Providers → Email**: *Email*
   enabled and **Confirm email** turned ON.

4. **Set URLs** — Authentication → **URL Configuration**:
   - **Site URL**: `https://tuvoria.app` (your real domain).
   - **Redirect URLs**: add `https://tuvoria.app/auth/callback` (and
     `http://localhost:3000/auth/callback` for local dev).
   This must match `NEXT_PUBLIC_APP_URL` in the app's env — the confirm link is
   built as `${NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`.

5. **Raise the email rate limit** — Authentication → **Rate Limits** → increase
   *Emails per hour* once custom SMTP is active.

6. **Paste the branded templates** — Authentication → **Emails**:
   - *Confirm signup*: subject `Confirm your Tuvoria account`, body =
     `supabase/templates/confirmation.html`.
   - *Reset password*: subject `Reset your Tuvoria password`, body =
     `supabase/templates/recovery.html`.

   (Or run `supabase config push` after `supabase link` — the CLI reads the
   `[auth.email.template.*]` blocks in `supabase/config.toml`. The dashboard is
   the quickest for a one-off.)

## Testing

- **Local dev** (`supabase start`): emails are NOT sent out — they're caught by
  Mailpit/Inbucket at **http://localhost:54324**. Open it to see the confirm link.
- **Production**: sign up with a real address, check inbox **and spam**. If it
  lands in spam, your SPF/DKIM (step 2) needs attention.

## If you want NO confirmation step

If you'd rather let users in immediately without email confirmation, turn
**Confirm email** OFF (step 3). The app already handles both: with confirmations
off, `signUpAction` gets a session back and routes straight into onboarding;
with it on, it shows the "check your email" message.
