# TuneTalez setup notes

## Repository

- GitHub repo: [https://github.com/Jaikarans2003/TuneTalezApp](https://github.com/Jaikarans2003/TuneTalezApp)
- The repo lives under the personal GitHub account **on purpose**. The account owner is an authorized signatory of TuneTalez. **No org transfer is planned.**

## Local env

Copy `.env.example` → `.env.local` and fill staging values. Never commit `.env.local`.

## Auth email OTP (staging)

- `config.toml`: `otp_length = 6`, `site_url = https://staging.tunetalez.com`, redirects include `http://localhost:8081`.
- **Dashboard fallback (required on free tier with default mailer):** Auth → Email Templates → **Magic Link** body must include `{{ .Token }}` (repo copy: `supabase/templates/magic_link.html`). CLI `config push` cannot update that template until Custom SMTP or a paid plan.
- Built-in Supabase email only delivers to **members of the Supabase org**. Add the tester’s email as a team member before OTP QA.

## Before launch

(Filled in Phase 1 Step 5 — SMTP, prod Supabase, store accounts, payments prep.)
