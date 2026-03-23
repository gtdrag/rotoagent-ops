# KPI Dashboard

Last updated: March 23, 2026 at 6:34 PM CT (auto-generated)

## Current Metrics (Production DB)

| Metric | Value | Notes |
|--------|-------|-------|
| Registered Users | 33 | All have emails |
| Active Users (used AI) | 23 | Made at least one AI call |
| Paying Subscribers | 7 | 6 annual + 1 monthly |
| Free Users | 16 | |
| Conversion Rate | 30% | Paid / active |
| iOS Users (push enabled) | 9 | Only counts push-accepted users |
| Android Users (push enabled) | 6 | Only counts push-accepted users |
| Chrome Extension Installs | 3 | |
| New Signups (today) | 3 | |
| New Signups (7 day) | 11 | |
| New Signups (28 day) | 19 | |
| iOS Reviews | 0 | Manual check needed |
| Android Reviews | 0 | Manual check needed |

## Subscription Breakdown

| Status | Count |
|--------|-------|
| free | 16 |
| pro_annual | 6 |
| pro_monthly | 1 |

## Surfaces

RotoAgent operates across 4 surfaces:
1. **iOS App** (App Store) — RevenueCat ✅, Push ✅, Better Auth ✅
2. **Android App** (Play Store) — RevenueCat ✅, Push ✅, Better Auth ✅
3. **Web App** (app.rotoagent.ai) — RevenueCat/Stripe ✅, Better Auth ✅
4. **Chrome Extension** — No RevenueCat (redirects to web), separate install tracking

## Targets

| KPI | Now | 30 Day | 60 Day | 90 Day |
|-----|-----|--------|--------|--------|
| Active Users | 23 | 55 | 165 | 440 |
| Paying Subs | 7 | 20 | 60 | 175 |
| Weekly Signups | ~11 | 12 | 35 | 100 |
| iOS Reviews | 0 | 10+ | 25+ | 50+ |
| Android Reviews | 0 | 10+ | 25+ | 50+ |

## Data Sources
- **Production DB (Neon/Vercel Postgres):** User counts, subscriptions, usage, emails (source of truth)
- **RevenueCat:** Subscription management, MRR, churn
- **App Store Connect:** Downloads, impressions, search terms (API key configured)
- **Google Play Console:** Installs, ratings, retention (API key configured)

## Update Cadence
- Auto-updated daily at 8:00 AM CT via cron job
