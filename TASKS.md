# TuneTalez — Phase 1 task board

Plain-English progress for builders. Code details live in the Phase 1 plan. Product scope: [`docs/PRD.md`](docs/PRD.md) §6.

## Phase 1 — Done

- [x] **Step 0 — Safety** — Git repo on `staging`, secrets ignored, staging Supabase + Cloudflare access checked, OnStar Cursor rules replaced with TuneTalez, this task board created.
- [x] **Step 1 — App skeleton** — Expo + Expo Router TypeScript app, 5 tabs + stack screens, env gate, LF line endings (no payment code).
- [x] **Step 2 — Staging database** — Schema, RLS, grants, seed (6×10), types generated. Auth switched to Google OR email + password (no OTP).
- [x] **Step 3 — Cloudflare media & hosting** — R2 buckets + CORS + custom domains, 6 staging posters (curl 200), Pages projects + `staging.tunetalez.com` (old CDN / `okvevo-nia-releases` untouched).
- [x] **Step 4 — Wire the app** — Home, series, Google / email+password sign-in, My List (`fe7ec67`).
- [x] **Step 5 — Deploy + CI + docs** — Staging Pages deploy workflow, GitHub `staging` env secrets, SETUP Before launch, payments decisions in `payments.mdc`.
- [x] **Step 6 — GitHub** — Remote on `staging`; push after each commit.

## Phase 1 DONE criteria (evidence)

1. **Staging Home + posters** — `curl -I https://staging.tunetalez.com` → 200; `curl -I https://media-staging.tunetalez.com/posters/midnight-train.jpg` → 200 (image/jpeg); seed has 6 published series.
2. **Auth → My List → sign out** — Wired in `fe7ec67` (`feat: wire Home, auth, and My List for Phase 1`); Google + email/password flows present in app.
3. **Typecheck + lint** — `npm run typecheck` and `npm run lint` both exit 0 locally (2026-10-15).
4. **Commits on staging + CI** — Branch `staging` tracks `origin/staging`; latest Staging workflow green: [run 38600915006](https://github.com/Jaikarans2003/TuneTalezApp/actions/runs/38600915006) (`dd59d95`).

## Phase 2 — Watch

Plan: [`docs/PHASE2_PLAN.md`](docs/PHASE2_PLAN.md). Product scope: [`docs/PRD.md`](docs/PRD.md) §6.

- [ ] **Step 0 — Persist plan** — `docs/PHASE2_PLAN.md` + this Phase 2 section (web MuxPlayer uses `tokens={{ playback, thumbnail, storyboard }}`).
- [ ] **Step 1 — Schema + types** — `episodes.mux_playback_id`; `watch_history` delete RLS; seed free EP 1–4; regenerate types.
- [ ] **Step 2 — Mux + issue-playback** — Edge Function mints three JWTs (`aud` v/t/s); upload script ≤10 basic assets; SETUP secret names.
- [ ] **Step 3 — Player core** — expo-video native; progress every 5 s; Episodes sheet; Up next; Play/Continue on series page.
- [ ] **Step 4 — For You + Continue + History** — For You EP1 feed; Home Continue watching; My List History segment.
- [ ] **Step 5 — Lock UI + web player** — Unlock shell (60 coins, no purchase); web split series layout; `@mux/mux-player-react` with `tokens` + muted autoplay.
- [ ] **Step 6 — Docs + verify** — SETUP + PRODUCTION_CHECKLIST Mux prod; typecheck/lint; web Chrome/Firefox/Safari.

## Up next

Phase 3 — Monetize (after Phase 2 DONE).
