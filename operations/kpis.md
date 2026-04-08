# KPI Dashboard

Last updated: April 8, 2026 at 8:01 AM CT (auto-generated)

## Current Metrics (Production DB)

| Metric | Value | Notes |
|--------|-------|-------|
| Registered Users | 49 | All have emails |
| Active Users (used AI) | 39 | Made at least one AI call |
| Paying Subscribers | 9 | 7 annual + 2 monthly |
| Free Users | 30 | |
| Conversion Rate | 23% | Paid / active |
| iOS Users (push enabled) | 20 | Only counts push-accepted users |
| Android Users (push enabled) | 8 | Only counts push-accepted users |
| Chrome Extension Installs | 3 | |
| New Signups (today) | 0 | |
| New Signups (7 day) | 8 | |
| New Signups (28 day) | 33 | |
| iOS Reviews | 0 | Manual check needed |
| Android Reviews | 0 | Manual check needed |

## Subscription Breakdown

| Status | Count |
|--------|-------|
| free | 30 |
| pro_annual | 7 |
| pro_monthly | 2 |

## Surfaces

RotoAgent operates across 4 surfaces:
1. **iOS App** (App Store) — RevenueCat ✅, Push ✅, Better Auth ✅
2. **Android App** (Play Store) — RevenueCat ✅, Push ✅, Better Auth ✅
3. **Web App** (app.rotoagent.ai) — RevenueCat/Stripe ✅, Better Auth ✅
4. **Chrome Extension** — No RevenueCat (redirects to web), separate install tracking

## Targets

| KPI | Now | 30 Day | 60 Day | 90 Day |
|-----|-----|--------|--------|--------|
| Active Users | 39 | 55 | 165 | 440 |
| Paying Subs | 9 | 20 | 60 | 175 |
| Weekly Signups | ~8 | 12 | 35 | 100 |
| iOS Reviews | 0 | 10+ | 25+ | 50+ |
| Android Reviews | 0 | 10+ | 25+ | 50+ |

## Data Sources
- **Production DB (Neon/Vercel Postgres):** User counts, subscriptions, usage, emails (source of truth)
- **RevenueCat:** Subscription management, MRR, churn
- **App Store Connect:** Downloads, impressions, search terms (API key configured)
- **Google Play Console:** Installs, ratings, retention (API key configured)

## Update Cadence
- Auto-updated daily at 8:00 AM CT via cron job
