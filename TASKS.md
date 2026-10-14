# TuneTalez — Phase 1 task board

Plain-English progress for builders. Code details live in the Phase 1 plan.

## Done

- [x] **Step 0 — Safety** — Git repo on `staging`, secrets ignored, staging Supabase + Cloudflare access checked, OnStar Cursor rules replaced with TuneTalez, this task board created.
- [x] **Step 1 — App skeleton** — Expo + Expo Router TypeScript app, 5 tabs + stack screens, env gate, LF line endings (no payment code).
- [x] **Step 2 — Staging database** — Schema, RLS, grants, seed (6×10), types generated. Auth switched to Google OR email + password (no OTP).
- [x] **Step 3 — Cloudflare media & hosting** — R2 buckets + CORS + custom domains, 6 staging posters (curl 200), Pages projects + `staging.tunetalez.com` (old CDN / `okvevo-nia-releases` untouched).

## Up next

- [x] **Step 4 — Wire the app** — Home, series, Google / email+password sign-in, My List (awaiting auth `config push` if diff is clean).
- [ ] **Step 5 — Deploy + CI + docs** — Staging site live, GitHub Actions, SETUP notes, payments decisions recorded for Phase 3.
- [ ] **Step 6 — GitHub** — Remote already set; keep pushing `staging` after commits.

## Phase 1 done when

1. `https://staging.tunetalez.com` shows Home with 6 series and posters.
2. Google or email+password sign-in → save to My List → sign out works.
3. Typecheck and lint pass; commits are on `staging` (push after repo URL).
