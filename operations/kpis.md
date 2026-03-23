# KPI Dashboard

Last updated: March 23, 2026

## Current Metrics (Production DB, March 23, 2026)

| Metric | Value | Source | Notes |
|--------|-------|--------|-------|
| Registered Users | 32 | `user` table | All have emails |
| Real Users (excl. test accounts) | ~22 | `user` table | Minus ~10 test/dev accounts |
| Active Users (used AI) | 22 | `user_usage` table | Have made at least one AI call |
| Paying Subscribers | 7 | `user_usage` table | 6 annual + 1 monthly |
| Free Users | 15 | `user_usage` table | |
| Conversion Rate | 32% | paid/active | Strong for early stage |
| iOS Users (push enabled) | 9 | `push_token` table | Only counts users who accepted push |
| Android Users (push enabled) | 5 | `push_token` table | Only counts users who accepted push |
| Chrome Extension Installs | 3 | `extension_install` table | |
| New Signups (March 23) | 2 | `user` table | arondewar, ereyesjimenez |
| iOS Reviews | 0 | App Store | Critical gap |
| Android Reviews | 0 | Play Store | Critical gap |

## Surfaces

RotoAgent operates across 4 surfaces:
1. **iOS App** (App Store) — RevenueCat ✅, Push ✅, Better Auth ✅
2. **Android App** (Play Store) — RevenueCat ✅, Push ✅, Better Auth ✅
3. **Web App** (app.rotoagent.ai) — RevenueCat/Stripe ✅, Better Auth ✅
4. **Chrome Extension** — No RevenueCat (redirects to web), separate install tracking

## Targets

| KPI | Now | 30 Day (Apr 23) | 60 Day (May 23) | 90 Day (Jun 23) |
|-----|-----|-----------------|-----------------|-----------------|
| Active Users | 22 | 55 | 165 | 440 |
| Paying Subs | 7 | 20 | 60 | 175 |
| Weekly Signups | ~5 | 12 | 35 | 100 |
| Churn Rate | Unknown | <10% | <10% | <5% |
| iOS Reviews | 0 | 10+ | 25+ | 50+ |
| Android Reviews | 0 | 10+ | 25+ | 50+ |

## Data Sources
- **Production DB (Neon/Vercel Postgres):** User counts, subscriptions, usage, emails (source of truth)
- **RevenueCat:** Subscription management, MRR, churn (note: may undercount vs DB)
- **App Store Connect:** Downloads, impressions, search terms (API key configured)
- **Google Play Console:** Installs, ratings, retention (API key configured)

## Update Cadence
- Todd or Larry updates this file weekly (Monday)
- Query production DB directly for accurate numbers
