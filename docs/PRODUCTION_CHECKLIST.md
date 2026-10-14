# Production Checklist (manual = Karan does it; Cursor = Cursor does it)

## Accounts (manual)
- [ ] Supabase: upgrade tunetalez-production to Pro (stops pausing; needed for custom auth domain)
- [ ] Apple Developer account as organization ($99/yr; needs D-U-N-S number for TuneTalez)
- [ ] Google Play Console account ($25 one-time)
- [ ] Google Cloud → IAM → add a second TuneTalez email as Owner

## Google login (manual, Google Cloud project "TuneTalez"; Branding/Audience/Data Access already done)
- [ ] Clients → Create client → Web application → "TuneTalez Web Production"
      Origins: https://tunetalez.com (+ https://www.tunetalez.com if used)
      Redirect URI: production Supabase Callback URL (Supabase → tunetalez-production → Authentication → Sign In / Providers → Google)
- [ ] Branding → Authorized domains → add the production xxxx.supabase.co domain
- [ ] Give production Client ID + secret to Cursor the way Cursor specifies (never paste the secret in chat)
- [ ] Android + iOS OAuth clients (after bundle IDs are set; Cursor gives the package name, SHA-1 and bundle ID)
- [ ] Brand verification (upload logo) so Google shows "TuneTalez"
- [ ] Supabase custom auth domain (e.g. auth.tunetalez.com) so Google doesn't show supabase.co

## Email (manual + Cursor)
- [ ] Manual: create a Resend or Postmark account, start domain verification for tunetalez.com
- [ ] Cursor: add the DNS records in Cloudflare, connect SMTP to Supabase production
- [ ] Cursor: turn ON email confirmation + build forgot password (production only)

## Website & legal
- [ ] Manual: confirm what tunetalez.com / www currently serve before Cursor points them to production
- [ ] Manual: real Privacy Policy + Terms text; Cursor publishes at tunetalez.com/privacy and /terms
- [ ] Cursor: in-app account deletion (required by Apple and Google)

## GitHub (manual)
- [ ] Settings → Environments → "production": add yourself as required reviewer + all secrets listed in SETUP.md

## Mobile apps
- [ ] Manual: decide bundle ID / package name (reuse the old TuneTalez store IDs if that app is live)
- [ ] Manual + Cursor: Sign in with Apple (required on iOS because Google login exists)
- [ ] Manual: test on a real iPhone and Android before submitting

## Payments (Phase 3, see payments.mdc)
- [ ] Manual: Razorpay business account + KYC
- [ ] Manual: enroll in Apple Small Business Program + Google Play 15% tier
- [ ] Cursor: re-check Google fee changes and the Apple vs CCI India case before building
