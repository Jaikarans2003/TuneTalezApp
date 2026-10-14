# TuneTalez — Product Requirements (PRD)

Owner: Karan · Version 1.0 · 15 Oct 2026
Layout reference: `docs/wireframes/TuneTalez_Wireframes.pdf` (screen numbers like **3.2** below point to it).
**Precedence:** this PRD wins over the wireframes wherever they differ (see §7).

---

## 1. Product
TuneTalez is a vertical (9:16) micro-drama app. Full drama series told in ~2-minute episodes. The first few episodes of every series are free; the rest unlock with coins or a VIP plan.

Platforms: **web, Android, iOS** from one Expo codebase. Same features and flows everywhere.

## 2. Users
- Indian mobile-first viewers who binge short dramas in their language.
- Content languages: Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi.
- Genres: Romance, Revenge, Family, Thriller, Fantasy, Comedy, Crime, Historical.
- Staging is shared with investors and accelerators: anyone can sign up and try it.

## 3. Stack (decided; see repo rules)
Expo + Expo Router (TypeScript) · Supabase (Postgres, Auth, RLS) · Cloudflare R2 (media) + Pages (web) · GitHub Actions (staging / production) · Payments per `payments.mdc` (Razorpay on web, Apple IAP on iOS, Google Play Billing on Android, one coin wallet).

## 4. Navigation
- **Mobile bottom tabs:** Home · For You · My List · Rewards · Profile (2.1).
- **Web top bar:** logo · Home · Browse · My List · Rewards · search · coin balance · Get coins · avatar. Footer: About, Help, Terms, Privacy, Refund policy, Contact, Get the iOS app, Get the Android app.

## 5. User flows

**F1 First launch (1.1–1.5)**
Splash (restores session; signed in → Home) → Onboarding, 3 slides (short episodes · free first episodes · coins & VIP; Skip) → Sign in (Skip allowed, guest can browse and watch free episodes) → Taste picker (≥3 genres + content languages; Skip; editable later in Settings) → Home.

**F2 Discover (2.1–2.5)**
- **Home:** auto-rotating hero banner (tap to play), genre chips, Continue watching (with progress), Trending now (ranked 1–N), New releases, one rail per picked genre. Coin pill → Store. Any poster → Series page.
- **For You:** full-screen swipe feed. Each card autoplays EP 1 of a series. Swipe up = next series, tap = pause, double-tap = like. Actions: Like, Save, Episodes, Share, "Watch full series" → Player. Preload the next 2 videos.
- **Search:** recent searches, trending searches, browse genres. Results as you type (300 ms debounce) across title, tags, cast. Filters: All · Completed · language · New. Row → Series page; play icon → Player EP 1. No results → trending + genres.
- **Genre page / "See all":** Popular · Newest · Completed; 3-column grid; infinite scroll, 30 per page.

**F3 Core loop: watch → paywall → unlock → keep going (3.1–3.5)**
- **Series page:** cover or silent trailer loop, title, meta (episodes · genre · language · status), synopsis (2 lines + More), main button "Play EP 1" or "Continue EP N", Save, episode grid in ranges of 30 with locks, "EP 1–N free" (free count set per series), You may also like.
- **Player:** full-screen vertical HLS stream. Swipe up/down = next/previous episode, tap = pause. Like, Save, Episodes, Share. Speed (1.0×), captions (CC), quality (Auto). Saves progress every 5 s so Continue watching resumes exactly. Auto-plays the next episode; a locked next episode opens the Unlock sheet.
- **Episodes sheet:** current episode highlighted, locked ones show a lock; tapping a locked one → Unlock sheet. "Auto-unlock next episodes with coins" toggle.
- **Up next:** 5-second countdown, then autoplay; Play now / Cancel. After the last episode: "You finished it" + 3 similar series.

**F4 Unlock, coins, VIP, rewards** (not in the wireframes yet; designed in Phase 3)
Unlock sheet (cost in coins, current balance, Get coins & unlock, Go VIP), Store (coin packs, VIP), My wallet, Purchase history, Rewards tab. All money rules follow `payments.mdc`.

**F5 My List & activity (5.1–5.3)**
- **Saved:** grid with progress ("EP 12 / 60", Not started, New EPs, Finished); tap resumes the last episode; Edit → select and remove; empty state links to Home.
- **History:** one row per series, newest first, progress bar; swipe left to remove; Clear all.
- **Notifications:** opened from the bell on Profile; in-app list (new episodes, series complete, VIP renewal), each row deep-links; Mark all read. Push notifications come later.

**F6 Profile & settings (6.1–6.5)**
- **Profile:** photo, name, email, Edit; My wallet, Purchase history, Rewards, Language, Feedback, Share TuneTalez. Guest sees a "Sign in" card instead.
- **Settings:** autoplay next episode, video quality, data saver (caps quality on mobile data), notification toggles (new episodes, rewards reminders), app language, content languages, Terms · Privacy · Refund policy, Log out, Delete account, app version. Toggles save instantly.
- **Edit profile:** photo (stored in R2, profile keeps the URL), name. Email shown read-only.
- **Feedback:** simple form.
- **Delete account:** lists what gets removed (coins, unlocks, VIP, history, My List), warns to cancel VIP in the app store first, user types DELETE to enable the button. Required by both stores.

**F7 Web specifics (web pages)**
Same features. Series page shows the player on the left and details + episode grid on the right, with prev/next episode buttons and a lock card ("EP 13 is locked · cost · balance · Get coins & unlock · Go VIP"). Keyboard: Space = play/pause, ←/→ = seek 5 s, ↑/↓ = previous/next episode.

**F8 Admin** (admin page; later phase)
Series & episodes (upload vertical MP4/MOV → video host transcodes automatically; thumbnail auto-picked if empty; free toggle; unlock cost; release date/time; draft / publish), Home rails & banners, Genres & tags, Payments, Coin packs & VIP, Rewards, Users, Support tickets, Admins & roles. Series stats: views, unlocks, coins spent, completion rate (7 days). Until Admin is built, content is managed through the Supabase dashboard, the video host's dashboard and seed scripts.

## 6. Phases
| Phase | Scope | Screens |
|---|---|---|
| **1 — Foundation** (done) | Tabs, Home rails (basic), Series page, Google + email/password sign-in, My List save/remove, staging web + CI | 2.1 (basic), 3.1, 5.1 (basic), 6.1 (basic) |
| **2 — Watch** | Player, Episodes sheet, Up next, watch progress + Continue watching, History tab, For You feed, lock UI (no purchase yet), web series player layout | 3.2, 3.3, 3.5, 2.2, 5.2, web series page |
| **3 — Monetize** | Coin wallet, Unlock sheet, Store, VIP, auto-unlock, purchase history, Rewards | F4 (wireframes first) |
| **4 — Discover & profile** | Onboarding, taste picker, Search + results, Genre pages, full Home rails + hero, likes, share, in-app notifications, Settings, Edit profile, Feedback, Delete account | 1.1–1.5, 2.3–2.5, 5.3, 6.2–6.5 |
| **5 — Admin** | Admin panel | F8 |
| **Launch** | Everything in `docs/PRODUCTION_CHECKLIST.md` (incl. Delete account and Sign in with Apple before store submission) | — |

## 7. Where this PRD differs from the wireframes
1. **Sign in:** Google **or** email + password (wireframe 1.3 shows Google only). Sign in with Apple is added on iOS before App Store submission.
2. **No phone number, no OTP anywhere.** Profile shows email instead of a phone number; Edit profile has no mobile field.
3. **Mobile "Get coins"** always uses the store's in-app purchase; apps never link to or mention cheaper web prices (`payments.mdc` hard rule). Web uses Razorpay.
4. The wireframes skip section 04 (coins / unlock / store / rewards) and screens 1.4 and 3.4. These get wireframed before Phase 3.

## 8. Non-goals (for now)
Phone/OTP login · downloads / offline viewing · comments or social feeds · user-uploaded content · ads · TV apps · multiple profiles per account.

## 9. Success metrics
Day-1 and Day-7 retention · episodes watched per session · episode completion rate · paywall unlock rate (free → paid) · paying users and revenue per paying user. Admin stats per series: views, unlocks, coins spent, completion rate.

## 10. Quality bar
- Next episode starts instantly (preloaded); adaptive HLS quality; smooth on low-end Android.
- Locked episodes cannot be played by URL (playback access is checked server-side).
- All data protected by RLS; secrets never in the client or git.
- Same layouts on iOS and Android; 9:16 artwork everywhere.

## 11. Open questions (defaults apply until Karan decides)
| # | Question | Default |
|---|---|---|
| 1 | Default free episodes per series | 4 (per series, editable in Admin) |
| 2 | Default unlock cost per episode | 60 coins (as in wireframes) |
| 3 | Coin pack prices, VIP price and period | Decide in Phase 3 |
| 4 | Rewards mechanics (e.g. daily check-in) | Decide in Phase 3 wireframes |
| 5 | App UI language at launch | English UI; content in all 7 languages |
| 6 | Where the drama content comes from at launch | Karan to confirm |
