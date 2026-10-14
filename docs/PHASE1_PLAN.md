---
name: TuneTalez Phase 1
overview: "Greenfield Phase 1 for TuneTalez: Expo + Expo Router app, staging Supabase schema/auth/seed, Cloudflare R2 media + Pages staging, wired Home/Series/Auth/My List, staging deploy + CI — with hard stops before any production Supabase, old CDN, or conflicting DNS. Payments decisions recorded in docs/rules only."
todos:
  - id: step-0-safety
    content: gitignore (incl mcp.json) + git init on staging + CLI verify (list may show staging only; link is real check) + full OnStar→TuneTalez rules + TASKS.md
    status: pending
  - id: step-1-skeleton
    content: Scaffold Expo Router TS, app.json web.output=single, .nvmrc, commit package-lock.json, no bundle IDs (TODO in SETUP), env.ts, tabs/stacks
    status: pending
  - id: step-2-supabase
    content: Init/link staging; migration with ENABLE RLS + GRANTs + security definer trigger (search_path=''); seed.sql; db push --include-seed; OTP; types; anon verify
    status: pending
  - id: step-3-cloudflare
    content: List DNS/buckets; R2; staging CORS with localhost; prod CORS without localhost; domains; posters; Pages via wrangler or CF API; curl verify
    status: pending
  - id: step-4-connect
    content: Official Expo supabase.ts; auth OTP; Home/series/My List/Profile; confirm graphify --help then graphify update .
    status: pending
  - id: step-5-ci-docs
    content: Export+Pages deploy; GHA with npm ci + .nvmrc + supabase link before db push (no seed); SETUP.md Before launch; payments.mdc Phase 3; typecheck/lint; commits
    status: pending
  - id: step-6-github
    content: After GitHub repo URL — remote + push staging branch
    status: pending
isProject: false
---

# TuneTalez Phase 1 — Foundation Plan

## Approved amendments (locked in)

1. Seed only in [`supabase/seed.sql`](supabase/seed.sql). Local: `supabase db push --include-seed`. **CI never seeds.**
2. Migration includes explicit **GRANTs** (see Step 2) plus RLS ownership policies. Also explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 5 tables. Sign-up trigger: `SECURITY DEFINER` + `SET search_path = ''`.
3. [`src/lib/supabase.ts`](src/lib/supabase.ts) follows Supabase’s official Expo quickstart exactly (session storage + AppState auto-refresh). Confirm current snippet via Supabase docs MCP / Context7 at implement time.
4. [`app.json`](app.json): `web.output = "single"`. Do **not** set `ios.bundleIdentifier` / `android.package` — leave TODO in SETUP.md.
5. Step 0: token is **staging-scoped**. Expect `projects list` to show **only** `tunetalez-staging`. **`supabase link`** is the real access check.
6. Add [`.cursor/mcp.json`](.cursor/mcp.json) to [`.gitignore`](.gitignore).
7. **Keep and use graphify** for codebase navigation. Keep `graphify.mdc`. After Step 4, confirm syntax via `graphify --help`, then run `graphify update .` (AST-only). Use `query` / `path` / `explain` when skimming or locating symbols. Empty folder at Step 0 does not need a build first.
8. If wrangler cannot attach `staging.tunetalez.com` to Pages, use the **Cloudflare API** with `CLOUDFLARE_API_TOKEN`. Do not stop for missing wrangler UX.
9. **`tunetalez-media-prod` CORS:** only `https://tunetalez.com` (no localhost, no staging origin).
10. CI: `npm ci` + `node-version-file: .nvmrc`; run `supabase link --project-ref $SUPABASE_PROJECT_REF` with `SUPABASE_DB_PASSWORD` env before `db push` (non-interactive). Commit `package-lock.json`.
11. **Payments (docs/rules only in Phase 1):** record locked decisions in `payments.mdc` and SETUP.md "Before launch". No payment code, tables, SDKs, or accounts now. Commit: `docs: record TuneTalez payments structure for Phase 3`.

## Pre-flight findings (readonly)

- Workspace has **no app code yet**; only [`.cursor/`](.cursor/), [`.env.local`](.env.local) (all 5 required keys present; values never printed), and `skills-lock.json`.
- **No git repo yet** — Step 0 creates `.gitignore` first, then `git init` on branch `staging`.
- Staging ref in `.env.local` matches known staging project; staging tables empty. Local CLI must only mutate staging.
- Cloudflare MCP is **docs-only** — account work via `npx wrangler` + Cloudflare API when needed.
- OnStar product rules under [`.cursor/rules/`](.cursor/rules/) are fully rewritten to TuneTalez in Step 0.

## Out-loud suggestions (kept)

1. Full OnStar → TuneTalez rule rewrite in Step 0.
2. No Zustand / TanStack Query this phase.
3. No `public/_redirects` — Cloudflare Pages serves `index.html` for unknown paths when there is no top-level `404.html`. Verify: `curl -I https://staging.tunetalez.com/series/<id>` returns 200.
4. Scaffold around non-empty folder (preserve `.cursor` / `.env.local`).
5. `npm run typecheck` + `npm run lint`; CI runs typecheck at minimum.
6. Gitignore `.cursor/mcp.json` (no real tokens in git).
7. Graphify for codebase orientation; update after Step 4.

## Hard stop conditions

- Missing/failed credential (`wrangler whoami`, zone access, or **`supabase link`** failure).
- DNS hostname already exists for `media-staging`, `media`, or `staging` in a conflicting way → stop and ask.
- Any action that would touch `tunetalez-production`, old R2 bucket, or `cdn.tunetalez.com`.
- MCP/CLI showing OnStar accounts.
- **Not a stop:** wrangler missing Pages custom-domain attach — use Cloudflare API instead.

## Git / GitHub

- You create the GitHub repo and paste the URL when ready.
- Working branch: **`staging`**. Local commits during Steps 0–5; **no push** until URL provided.
- Then: `git remote add origin <url>` → `git push -u origin staging`.
- Production workflow watches branch **`production`** only (no Phase 1 push to it).

## Execution method

Before each Step 0–5 block: write a **3–5 line mini-plan**, then execute only that block. Smallest working code. Commit on `staging`. Push only after repo URL.

**Graphify (when helpful):** Once `app/` / `src/` exist, keep the graph current with `graphify update .` (AST-only). Prefer `graphify query` / `path` / `explain` before broad Grep/Read when locating cross-file flows. Confirm syntax via `graphify --help` before first update. Empty folder at Step 0 does not need a build first.

---

## Step 0 — Safety + full OnStar → TuneTalez rules

**Mini-plan:** Ignore secrets. Prove staging CLI access (list may be staging-only). Rewrite rules. Ignore mcp.json.

1. Create [`.gitignore`](.gitignore): Expo defaults + `.env*` + `!.env.example` + **`.cursor/mcp.json`**. Then `git init` + branch **`staging`**. Verify ignore checks.
2. Load `.env.local`. `npx supabase projects list` — expect only `tunetalez-staging`. `npx wrangler whoami` + zone `tunetalez.com`. Stop if wrangler/zone fails.
3. Rewrite all OnStar product rules → TuneTalez (table below). Keep `graphify.mdc`.
4. Create [`TASKS.md`](TASKS.md). Commit: `chore: replace OnStar Cursor rules with TuneTalez`.

---

## Step 1 — App skeleton

**Mini-plan:** Latest Expo + Router + TS. `web.output=single`. `.nvmrc`. No bundle IDs. Env gate. Tabs/stacks.

1. Scaffold Expo (TS + Expo Router) in-place (preserve `.cursor` / `.env.local`).
2. Set `expo.web.output` to `"single"`. **Do not** set `ios.bundleIdentifier` / `android.package` (TODO in SETUP.md).
3. Add [`.nvmrc`](.nvmrc) (Node LTS matching local). Commit `package-lock.json`.
4. Deps: `zod`, `@supabase/supabase-js`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`, `expo-image`. Scripts: `typecheck`, `lint`.
5. [`src/config/env.ts`](src/config/env.ts) — only env reader; zod-validated public vars.
6. Fetch staging URL + publishable key; append to `.env.local`. Write `.env.example`.
7. Tabs + stack screens; grayscale placeholders.
8. Commit: `chore: scaffold Expo app skeleton`.

---

## Step 2 — Supabase staging only

**Mini-plan:** Link staging. Migration with ENABLE RLS + GRANTs + secure trigger. Seed file separate. Types + verify.

1. `supabase init` → `supabase link --project-ref $SUPABASE_STAGING_PROJECT_REF` (stop on failure).
2. **One migration** (no seed data):
   - Tables as specified
   - Explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on `profiles`, `series`, `episodes`, `my_list`, `watch_history`
   - Trigger function: `SECURITY DEFINER` + `SET search_path = ''`
   - GRANTs as in amendment 2
   - RLS policies as specified
3. [`supabase/seed.sql`](supabase/seed.sql) only: 6×10 seed data.
4. Email OTP in `config.toml`; `config push`; dashboard fallback in SETUP.md.
5. `supabase db push --include-seed` → gen types → `src/types/database.ts`.
6. Anon verify: 6 series; my_list empty.
7. Commit: `feat: staging schema, grants, RLS, seed.sql, email OTP`.

---

## Step 3 — Cloudflare (avoid old assets)

**Mini-plan:** List DNS/buckets. Create R2; staging CORS includes localhost; prod CORS does not. Domains + posters + Pages.

1. List buckets/DNS; stop on conflicting hostnames. Never touch old bucket / `cdn.tunetalez.com`.
2. Create both media buckets.
3. CORS: staging allows `https://staging.tunetalez.com`, `https://tunetalez.com`, `http://localhost:8081`. **Prod (`tunetalez-media-prod`) allows only `https://tunetalez.com`.**
4. Custom domains via wrangler; no r2.dev.
5. Six 9:16 posters → staging `posters/`.
6. Pages projects; attach `staging.tunetalez.com` (wrangler or CF API). Leave apex/www alone.
7. curl verify posters → 200. Set media URL in `.env.local`.
8. Commit non-secret assets/scripts.

---

## Step 4 — Connect app to data

**Mini-plan:** Official Expo client. Wire UI to data. Confirm graphify CLI then update graph.

1. `supabase.ts` per official Expo quickstart (confirm via docs MCP).
2. Auth provider + OTP screens.
3. Home rails + series page + My List + Profile.
4. Confirm update syntax: `graphify --help`, then `graphify update .`.
5. Commit: `feat: home, series, auth OTP, my list`.

---

## Step 5 — Staging deploy + CI + docs + payments decisions

**Mini-plan:** Deploy staging web. CI with npm ci + .nvmrc + link-before-push. SETUP Before launch + payments.mdc Phase 3 docs. No payment code.

1. Export + deploy to `tunetalez-web-staging`. No `_redirects`. Verify: `curl -I https://staging.tunetalez.com/series/<id>` → 200.
2. Workflows: `node-version-file: .nvmrc`, `npm ci`, `supabase link --project-ref $SUPABASE_PROJECT_REF` with `SUPABASE_DB_PASSWORD` env (non-interactive) before `db push` (no seed).
3. [`docs/SETUP.md`](docs/SETUP.md) **"Before launch"** section:
   - Custom SMTP (Resend/Postmark)
   - Prod Supabase on Pro
   - Bundle IDs TODO (ios.bundleIdentifier / android.package not set in Phase 1)
   - Apple Developer org account ($99/yr; D-U-N-S for TuneTalez entity)
   - Google Play Console ($25 one-time)
   - Enroll Apple Small Business Program + Google Play 15% tier
   - Razorpay business account + KYC
   - iOS IAP for coins (per payments.mdc)
4. Update [`payments.mdc`](.cursor/rules/payments.mdc) with locked Phase 3 decisions (docs only; no payment code/tables/SDKs/accounts):
   - One coin wallet per user in Supabase; all purchase sources credit it; coins work cross-platform
   - Coins credited only by server after verified purchase (Razorpay webhook signature / Apple-Google receipt). Never client
   - Web: Razorpay (primary/cheapest). iOS: Apple IAP consumables only. Android: Google Play Billing (Razorpay alt billing deferred)
   - HARD RULE: no in-app text/button/link/price pointing to web purchase or saying web is cheaper; promote web only outside apps
   - Coin pack prices may differ by platform
   - Phase 3 decides RevenueCat vs direct Edge Function receipt validation
   - Before Phase 3: re-check Google global fee/link-out (India by Sept 2027) and Apple vs CCI India case
5. Update `project-context.mdc` roadmap: Phase 3 = coins + payments per `payments.mdc`.
6. Verify: `rg -i "razorpay|in-app purchase" .cursor/rules docs` shows new content; no `src/` or `supabase/` payment changes.
7. Commits including `docs: record TuneTalez payments structure for Phase 3`.
8. Typecheck + lint. No push until GitHub URL.

## Step 6 — Connect GitHub (blocked on you)

1. You paste the repo URL.
2. `git remote add origin <url>` → `git push -u origin staging`.
3. You add GitHub Environments + secrets from SETUP.md.

### GitHub Environment secrets

**staging:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_MEDIA_URL`, `EXPO_PUBLIC_APP_ENV=staging`.

**production:** same keys for production project / `media.tunetalez.com` / `tunetalez-web` (approval required). Local `.env.local` stays staging-only.

---

## Cursor rules — complete OnStar → TuneTalez rewrite

| File | Action |
| --- | --- |
| [`project-context.mdc`](.cursor/rules/project-context.mdc) | Full rewrite: TuneTalez; Phase 3 = coins + payments per payments.mdc |
| [`supabase.mdc`](.cursor/rules/supabase.mdc) | Phase 1 tables; ENABLE RLS; GRANTs; secure trigger; seed.sql only; CI never seeds |
| [`deploy.mdc`](.cursor/rules/deploy.mdc) | staging/production branches; npm ci + .nvmrc; link before db push |
| [`payments.mdc`](.cursor/rules/payments.mdc) | Full Phase 3 locked decisions (wallet, server credit, platform channels, HARD RULE no in-app web promo) |
| **New** `cloudflare-safety.mdc` | Zone; never old R2/cdn; DNS first; CF API for Pages domain |
| **New** `secrets.mdc` | Never print/commit secrets; mcp.json gitignored |
| Keep | `karpathy-guidelines.mdc`, `graphify.mdc` |

Verify: no `OnStar` / `onstar` under `.cursor/rules/`. Verify payments content via `rg -i "razorpay|in-app purchase" .cursor/rules docs`.

---

## DONE criteria

1. `https://staging.tunetalez.com` loads Home with 6 series + posters.
2. Email OTP → My List save → sign out works.
3. Verify outputs from Steps 0, 2, 3.
4. Typecheck and lint passing.
5. Commits on `staging`; push after you paste the GitHub repo URL.
