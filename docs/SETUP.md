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

**Expo Go + Google on a physical phone:** start Metro with a tunnel so the OAuth redirect is a hostname (not a LAN IP / localhost):

```bash
npx expo start --tunnel --port 8081
```

Full failure modes + mitigations (LAN IP → staging site, localhost → “Failed to download remote update”, missing `/auth/callback` → Unmatched Route, WebCrypto/PKCE): see Cursor rule [`.cursor/rules/expo-go-google-oauth.mdc`](../.cursor/rules/expo-go-google-oauth.mdc).

## Cloudflare Stream video (Phase 2 staging)

- Video host = **Cloudflare Stream** on the shared Azonova account. Only touch videos with `meta.product = "tunetalez"` (see `cloudflare-safety.mdc`). Posters stay on R2.
- DB column `episodes.video_id` stores the Stream UID (provider-agnostic). The app only receives a signed `hlsUrl` from `issue-playback`.
- **Edge Function** `issue-playback`: `[functions.issue-playback] verify_jwt = false` in [`supabase/config.toml`](../supabase/config.toml); auth via `@supabase/server` `withSupabase({ auth: ['user', 'publishable'] })`. Mints a Stream JWT (RS256; `sub` = video UID; `kid` + `exp` ≤ 1h) and returns `{ hlsUrl: https://customer-<CODE>.cloudflarestream.com/<TOKEN>/manifest/video.m3u8 }`.
- **Edge secrets** (names only — never commit values): `STREAM_SIGNING_KEY_ID`, `STREAM_SIGNING_JWK` (base64 JWK from `POST /accounts/.../stream/keys`), `STREAM_CUSTOMER_CODE` (subdomain code from `playback.hls`).
- Local upload: `CLOUDFLARE_API_TOKEN` (needs **Stream:Edit**), `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_SERVICE_ROLE_KEY` → `node scripts/upload-staging-videos.mjs`. Do not put Stream signing material in `EXPO_PUBLIC_*`.
- Native: `expo-video` + `hlsUrl`. Web: `hls.js` when `Hls.isSupported()` (MSE); native HLS fallback for Safari iOS. Muted autoplay + tap to unmute.

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
