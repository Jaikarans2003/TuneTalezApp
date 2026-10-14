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
- `site_url = https://staging.tunetalez.com`; additional redirects (staging): `https://staging.tunetalez.com/**`, `http://localhost:8081/**`, `tunetalez://**`, `exp://**` (Expo Go, staging only).
- App scheme: `tunetalez` in `app.json`. Phase 1 Google = `signInWithOAuth({ provider: 'google' })` only (web redirect; Expo Go uses `expo-web-browser` + PKCE `exchangeCodeForSession`). No `@react-oauth/google` or native Google SDKs.
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

Do these before production go-live (also tracked in [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)):

- Custom SMTP for auth email (Resend or Postmark) — staging has confirmations off
- Prod Supabase on Pro (avoids pausing; needed for custom auth domain)
- Bundle IDs TODO: set `ios.bundleIdentifier` / `android.package` (not set in Phase 1)
- Apple Developer org account ($99/yr; D-U-N-S for TuneTalez entity)
- Google Play Console ($25 one-time)
- Enroll Apple Small Business Program + Google Play 15% tier
- Razorpay business account + KYC
- iOS IAP for coins (per `payments.mdc`)

## GitHub Environments

**staging** (created in Phase 1): secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_MEDIA_URL`, `EXPO_PUBLIC_APP_ENV=staging`.

**production**: same key names for production values — create only when going live (see PRODUCTION_CHECKLIST.md).
