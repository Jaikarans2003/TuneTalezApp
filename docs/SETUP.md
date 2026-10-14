# TuneTalez setup notes

## Repository

- GitHub repo: [https://github.com/Jaikarans2003/TuneTalezApp](https://github.com/Jaikarans2003/TuneTalezApp)
- The repo lives under the personal GitHub account **on purpose**. The account owner is an authorized signatory of TuneTalez. **No org transfer is planned.**

## Local env

Copy `.env.example` → `.env.local` and fill staging values. Never commit `.env.local`.

Google OAuth (staging): set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in `.env.local` only. Never commit or paste the secret. Do not commit Google `client_secret*.json` downloads (gitignored).

## Auth (staging)

Sign up / log in = **Google** OR **email + password**. No OTP, no magic link.

- `config.toml`: email signup on; `minimum_password_length = 8`; `enable_confirmations = false` (**staging only** — turn confirmations on before launch with custom SMTP).
- `[auth.external.google]` enabled; `client_id` / `secret` via `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)` / `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)`.
- `site_url = https://staging.tunetalez.com`; redirects include `http://localhost:8081`.
- Google OAuth consent screen is published **In production** (scopes: `openid`, email, profile only). Anyone can sign in on staging.
- Google branding privacy URL: `https://tunetalez.com/privacy` (app ships a placeholder `/privacy` page; replace with the real policy before launch).

After editing `config.toml`, run `supabase config push` only after reviewing the CLI diff. Load secrets from `.env.local` into the shell when pushing so `env(...)` resolves.

### Step 4 — Expo Go vs development build (official Supabase Expo docs)

Follow Supabase’s current Expo guides: [Expo quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native), [native deep linking / OAuth](https://supabase.com/docs/guides/auth/native-mobile-deep-linking?platform=react-native), and [Expo social auth](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth).

| Method | Expo Go | Needs development build / prebuild |
| --- | --- | --- |
| Email + password (`signUp` / `signInWithPassword`) | Works (web + native Expo Go) | Not required |
| Google via `signInWithOAuth` + `expo-web-browser` / `expo-auth-session` (browser redirect) | Works if redirect URLs include the Expo Go `exp://` URI | Custom app scheme / Store builds need a scheme + redirect allowlist |
| Google / Apple via native SDKs (official social-auth guide paths: Invertase / `expo-apple-authentication` / native Google clients) | Does **not** work in Expo Go | Required (`npx expo prebuild` / `expo run:*` or EAS dev client) |
| Web Google with `@react-oauth/google` | N/A (browser only) | Works with `npx expo start --web` (+ tunnel origins if testing that way) |

Phase 1 Step 4 should prefer email/password + browser OAuth Google so Expo Go QA stays possible; native SDK buttons can wait for store / Apple guideline work.

## Before launch

- **Email confirmation + forgot password** — needs custom SMTP (Resend/Postmark); set `enable_confirmations = true` on production.
- **Sign in with Apple on iOS** — Apple App Store guideline 4.8 when offering other third-party logins.
- **Google brand verification + Supabase custom auth domain** — so the consent screen shows “TuneTalez”, not `*.supabase.co`.
- **Real privacy policy** live at `https://tunetalez.com/privacy` (replace the placeholder page).
- (Filled further in Phase 1 Step 5 — prod Supabase, store accounts, payments prep.)
