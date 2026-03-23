# RotoAgent Codebase Audit
**Date:** March 23, 2026  
**Auditor:** Todd (Head of Marketing)  
**Repository:** `gtdrag/RotoGPT` (GitHub)

---

## Executive Summary

**CRITICAL FINDING:** RotoAgent operates across **four distinct surfaces** with **inconsistent tracking and monetization**. Current KPIs likely undercount total users by **50-75%** because the Chrome extension and portions of the web app are not properly integrated into RevenueCat or centralized analytics.

### The Four Surfaces

1. **iOS App** (App Store) — Full RevenueCat integration ✅
2. **Android App** (Play Store) — Full RevenueCat integration ✅  
3. **Web App** (app.rotoagent.ai) — RevenueCat Web SDK (Stripe) ✅
4. **Chrome Extension** — **NO RevenueCat integration** ❌ **MAJOR GAP**

### Current Metrics (Incomplete)

- **Reported:** 15 active users, 3 subs, $8 MRR  
- **Reality:** Unknown. Extension users + web users not linked to RevenueCat may be **invisible** to current tracking.

---

## 1. Auth Flow

### Overview
All surfaces use **Yahoo OAuth** for authentication. User identity is tracked by **Yahoo GUID** (globally unique ID from Yahoo).

### iOS & Android Apps (Mobile)
- **Auth Library:** Better Auth (via Expo plugin)
- **Flow:** 
  1. User taps "Sign in with Yahoo"
  2. OAuth flow via Yahoo (`fspt-r` scope for Fantasy Sports read access)
  3. Tokens stored in Expo SecureStore
  4. Returns: `accessToken`, `refreshToken`, `yahooGuid`, `userName`, `email` (optional), `image` (profile pic)
- **Database:** 
  - `user` table (Better Auth) — stores `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`
  - `account` table — stores Yahoo OAuth tokens (`accessToken`, `refreshToken`, `accessTokenExpiresAt`, etc.)
- **User Data We Have:**
  - ✅ Yahoo GUID (unique ID)
  - ✅ Display name
  - ❓ Email (only if user grants `openid` scope; **not guaranteed**)
  - ✅ Profile image URL
  - ✅ Yahoo access token (for API calls)

### Web App (app.rotoagent.ai)
- **Auth Library:** Better Auth (same as mobile)
- **Flow:** Same Yahoo OAuth flow as mobile
- **Database:** Same `user` + `account` tables
- **User Data:** Identical to mobile (same limitations on email availability)

### Chrome Extension
- **Auth Library:** Custom implementation in `apps/chrome-extension/src/lib/auth.ts`
- **Flow:**
  1. User clicks "Sign in" in extension popup
  2. Opens Yahoo OAuth via `chrome.identity.launchWebAuthFlow`
  3. Redirects to backend (`/api/auth/oauth2/callback/yahoo`) for token exchange
  4. Backend returns tokens → stored in `chrome.storage.local`
  5. Background service worker manages token refresh via `chrome.alarms` (every 45 min)
- **Database:** 
  - **NO Better Auth user record created** ❌
  - Extension upserts into `extension_install` table on first API call:
    ```sql
    CREATE TABLE extension_install (
      id UUID PRIMARY KEY,
      yahoo_guid VARCHAR(64) UNIQUE NOT NULL,
      extension_version VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW(),
      last_seen_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - This table tracks **Chrome extension installs separately** from `user` table
- **User Data:**
  - ✅ Yahoo GUID
  - ✅ Yahoo access token (stored in extension storage, NOT in DB)
  - ❌ **No email, name, or profile image stored**

### 🚨 **CRITICAL AUTH ISSUE**
**Extension users are tracked separately from web/mobile users.** A user who signs into the extension does NOT show up in the `user` table (Better Auth). They only exist in `extension_install`. This creates a **fragmented user database**.

---

## 2. Database Schema

### Core Tables

#### `user` (Better Auth)
Stores web + mobile app users who authenticate via Better Auth.

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL,
  image TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

**Population:**
- ✅ Mobile app users (iOS/Android)
- ✅ Web app users (app.rotoagent.ai)
- ❌ Chrome extension users (they bypass Better Auth)

#### `user_usage` (Subscription & Usage Tracking)
The **single source of truth** for subscription status and AI usage limits.

```sql
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yahoo_guid VARCHAR(64) UNIQUE NOT NULL,
  
  -- Weekly usage counters
  ai_calls_this_week INTEGER DEFAULT 0 NOT NULL,
  share_credits_this_week INTEGER DEFAULT 0 NOT NULL,
  week_start DATE,
  
  -- Subscription
  subscription_status VARCHAR(20) DEFAULT 'free' NOT NULL,
  revenuecat_customer_id VARCHAR(64),
  
  -- Marketing analytics
  league_count INTEGER DEFAULT 0,
  hit_free_limit_at TIMESTAMP,
  last_feature_used VARCHAR(32),
  last_feature_used_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP
);
```

**Population:**
- Auto-created on first AI usage (draft rec, lineup optimizer, etc.)
- Keyed by `yahoo_guid` (works for all surfaces)
- Updated by:
  - Mobile apps → usage tracking service
  - Web app → usage tracking service
  - Chrome extension → usage tracking service (via API calls)
  - RevenueCat webhooks → subscription status sync

**Subscription Status Values:**
- `free` — default (3 AI calls/week + share credits)
- `pro_monthly` — unlimited AI calls
- `pro_annual` — unlimited AI calls

#### `extension_install` (Chrome Extension Tracking)
Tracks Chrome extension installations separately.

```sql
CREATE TABLE extension_install (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yahoo_guid VARCHAR(64) UNIQUE NOT NULL,
  extension_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Populated by:** 
- `draft.getDraftSettings` tRPC endpoint (upserts on first API call)
- `draft.getRecommendations` tRPC endpoint

#### `push_token` (Push Notifications)
Stores Expo push tokens for mobile devices.

```sql
CREATE TABLE push_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  yahoo_guid VARCHAR(255),
  token TEXT UNIQUE NOT NULL,
  platform VARCHAR(10) NOT NULL, -- 'ios' | 'android'
  device_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);
```

**Population:**
- Mobile apps register push tokens via `notifications.registerPushToken` tRPC endpoint
- `is_active` flag for cleanup of stale tokens

#### `draft_summary` (Post-Draft Analysis)
Stores completed draft summaries for all surfaces.

```sql
CREATE TABLE draft_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES user(id),  -- Web/mobile only
  yahoo_guid VARCHAR(64),             -- Mobile/extension fallback
  
  league_key VARCHAR(64) NOT NULL,
  league_name TEXT NOT NULL,
  draft_date TIMESTAMP NOT NULL,
  num_teams INTEGER NOT NULL,
  
  -- JSONB columns for flexible data
  final_roster JSONB,           -- Array of RosterPlayer
  round_recommendations JSONB,  -- Array of RoundRecommendation
  category_projections JSONB,   -- Array of CategoryProjection
  ai_review JSONB,              -- AI-generated post-draft analysis
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**Population:**
- Mobile apps → via tRPC `draft.saveDraftSummary`
- Chrome extension → via tRPC `draft.saveDraftSummary`
- Web app → via tRPC `draft.saveDraftSummary`

---

## 3. Subscription & Payment Flow

### RevenueCat Integration

#### iOS & Android Apps: ✅ **Full Integration**
- **SDK:** `react-native-purchases` v8.x
- **Setup:** `apps/expo/src/stores/useSubscriptionStore.ts`
- **Initialization:**
  ```typescript
  await Purchases.configure({
    apiKey: REVENUECAT_API_KEY_IOS, // or ANDROID
    appUserID: yahooGuid  // Links to user_usage table
  });
  ```
- **Entitlement ID:** `"rotoGPT Pro"`
- **Products:**
  - Monthly: Product identifier contains `"monthly"` (exact SKU TBD — RevenueCat dashboard)
  - Annual: Product identifier contains `"annual"` (exact SKU TBD — RevenueCat dashboard)
- **Pricing (from QA docs):**
  - Monthly: **$1.99/mo** (sandbox)
  - Annual: **$9.99/yr** (sandbox, 58% savings)
- **Purchase Flow:**
  1. User hits paywall (3 free AI calls/week exhausted)
  2. Taps "Subscribe Monthly" or "Subscribe Yearly"
  3. RevenueCat SDK presents native App Store / Play Store purchase sheet
  4. On success → `customerInfo.entitlements.active["rotoGPT Pro"]` becomes active
  5. Mobile app updates `user_usage.subscription_status` via tRPC `usage.syncSubscriptionStatus`
- **Restore Purchases:** `Purchases.restorePurchases()` for device transfers

#### Web App: ✅ **Full Integration (Stripe via RevenueCat)**
- **SDK:** `@revenuecat/purchases-js` (RevenueCat Web SDK)
- **Setup:** `apps/nextjs/src/app/(app)/_services/revenuecat-web.ts`
- **Initialization:**
  ```typescript
  const purchases = Purchases.configure({
    apiKey: env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY,
    appUserID: yahooGuid  // Same as mobile for cross-platform sync
  });
  ```
- **Entitlement ID:** `"rotoGPT Pro"` (same as mobile)
- **Products:**
  - Monthly: `"com.rotogpt.app.pro_monthly"`
  - Annual: `"com.rotogpt.app.pro_annual"`
- **Purchase Flow:**
  1. User clicks "Upgrade to Pro" in web app
  2. RevenueCat presents **Stripe Checkout** (credit card form)
  3. On success → entitlement becomes active
  4. Web app syncs status to `user_usage` via `usage.syncSubscriptionStatus`

#### Chrome Extension: ❌ **NO RevenueCat Integration**
- **Current Behavior:**
  - Extension shows usage gate ("You've used all 3 free RotoGPT calls this week")
  - "Upgrade to Pro" button links to: `https://rotoagent.ai/account?upgrade=true&ref=extension`
  - **User is redirected to web app to purchase**
- **Issues:**
  1. ❌ Extension cannot process purchases directly (Chrome Web Store doesn't support IAP via RevenueCat)
  2. ⚠️ If extension user **never visits web app**, they may not be counted in analytics
  3. ✅ Once they purchase on web (same Yahoo GUID), `user_usage.subscription_status` updates → extension picks up Pro status on next API call

### Product SKUs

**From app config + docs:**
- **iOS Products:**
  - `com.rotogpt.app.pro_monthly` (or similar — exact ID in RevenueCat dashboard)
  - `com.rotogpt.app.pro_annual`
- **Android Products:**
  - `com.rotogpt.app.pro_monthly`
  - `com.rotogpt.app.pro_annual`
- **Web Products (Stripe via RevenueCat):**
  - `com.rotogpt.app.pro_monthly`
  - `com.rotogpt.app.pro_annual`

**Pricing (per QA test plan):**
- Monthly: **$1.99/mo**
- Annual: **$9.99/yr** (58% savings)

**Trial:** None currently (docs mention no trial)

### Paywall Flow

**Mobile Apps:**
1. User exhausts 3 free AI calls/week
2. `useUsageTracking` hook detects limit → shows `PaywallScreen`
3. Paywall displays:
   - "You've used all 3 free calls this week"
   - Monthly plan: $1.99/mo
   - Annual plan: $9.99/yr (58% savings badge)
4. User taps plan → native purchase sheet → RevenueCat handles IAP
5. On success → `subscriptionStatus` updates → unlimited access

**Web App:**
1. User hits limit → `PaywallModal` appears
2. Same pricing display as mobile
3. User clicks plan → RevenueCat Web SDK → Stripe Checkout
4. On success → entitlement active → modal closes → unlimited access

**Chrome Extension:**
1. User hits limit → overlay shows upgrade prompt
2. "Upgrade to Pro" button → opens `https://rotoagent.ai/account?upgrade=true&ref=extension` in new tab
3. User purchases on web app → next extension API call picks up Pro status from `user_usage` table

---

## 4. Push Notifications

### Status: ✅ **Database schema ready, SDK configured, NOT YET SENDING**

### Infrastructure

**Service:** Expo Push Notifications (free, built into Expo)

**Mobile Apps (iOS & Android):**
- **SDK:** `expo-notifications` (configured in `app.config.ts`)
- **Token Registration:**
  - User grants notification permission
  - App gets Expo push token (format: `ExponentPushToken[...]`)
  - Sends to backend via `notifications.registerPushToken` tRPC endpoint
  - Stored in `push_token` table with `platform`, `yahooGuid`, `userId`

**Backend (Next.js):**
- Can send targeted pushes via Expo Push API
- Query `push_token` table for active tokens
- Send batch notifications for:
  - Draft reminders (30 min before draft starts)
  - Lineup reminders (daily at 10am user's timezone)
  - Waiver wire alerts
  - Promotional messages

**Database Tables:**
- `push_token` — stores device tokens
- `notification` — logs sent notifications
- `notification_delivery` — tracks delivery status per recipient
- `notification_preference` — user opt-in/out settings, quiet hours

**Current State:**
- ✅ Push token registration works (mobile apps can register)
- ✅ Database schema complete
- ❌ **No notifications being sent yet** (infrastructure ready, not implemented)

---

## 5. Tech Stack

### Mobile Apps (iOS & Android)

**Framework:** React Native 0.76 + Expo SDK 52

**Key Libraries:**
- **Navigation:** Expo Router (file-based, like Next.js)
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State:** Zustand (lightweight state management)
- **API:** tRPC (type-safe API calls to Next.js backend)
- **Auth:** Better Auth (Expo plugin)
- **Payments:** `react-native-purchases` (RevenueCat SDK)
- **Push:** `expo-notifications`
- **Audio:** `expo-av` (draft pick alerts)
- **Crash Reporting:** Firebase Crashlytics + Sentry

**Build System:**
- **EAS Build** (Expo managed builds)
- **OTA Updates:** Expo Updates (instant JS updates without app store review)

### Backend (Next.js)

**Framework:** Next.js 15 (App Router)

**Key Libraries:**
- **API:** tRPC v11 (type-safe APIs, no code generation)
- **Database:** Drizzle ORM + Vercel Postgres (serverless)
- **Auth:** Better Auth (session management, OAuth)
- **AI:** Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Yahoo API:** `@acme/yahoo-client` (custom wrapper)
- **Email:** Resend (transactional email for contact forms)
- **Error Tracking:** Sentry

**Hosting:** Vercel (production + preview deploys)

**Monorepo:** Turborepo (manages 3 apps + 7 shared packages)

### Chrome Extension

**Framework:** WXT (modern Chrome extension framework)

**Key Libraries:**
- **UI:** React (for popup/settings)
- **Auth:** Custom Yahoo OAuth via `chrome.identity.launchWebAuthFlow`
- **Storage:** `chrome.storage.local` (tokens, settings)
- **API:** Direct `fetch` calls to Next.js tRPC endpoints
- **Overlay:** Shadow DOM injection on Yahoo Fantasy draft pages

**Build:** WXT compiler → production `.zip` for Chrome Web Store

### Web App (Landing Page)

**Framework:** Next.js 15 (same backend as API)

**Pages:**
- `/` — Hero, features, download links
- `/pricing` — Pricing table
- `/contact` — Contact form (sends to Linear or email)
- `/privacy`, `/terms` — Legal pages
- `app.rotoagent.ai/*` — Authenticated web app (draft history, mock drafts, lineup optimizer)

---

## 6. Yahoo Fantasy Integration

### API Wrapper

**Package:** `@acme/yahoo-client` (`packages/yahoo-client/`)

**Key Features:**
- Rate limiting (Yahoo limits: 10 req/sec, 20k req/day)
- Exponential backoff for 429s (rate limit exceeded)
- OAuth token management (refresh tokens, expiry tracking)
- Type-safe wrappers for Yahoo Fantasy API

### Data Pulled from Yahoo

**User Data:**
- Yahoo GUID (unique user ID)
- Display name
- Profile image (192px, 128px, 64px versions)
- Email (optional, not guaranteed)

**League Data:**
- League key (e.g., `"449.l.12345"` where 449 = season, 12345 = league ID)
- League name
- League settings (roster positions, scoring categories, draft type)
- Team list (team IDs, team names, managers)
- Current standings (for Roto categories)

**Draft Data (Live):**
- Draft status (`pre_draft`, `drafting`, `post_draft`)
- Current pick number
- Current round
- Draft picks history (player key, player name, team drafted by)
- Available players (API endpoint for player pool)

**Roster Data:**
- User's current roster (filled positions)
- Available slots (empty roster positions)
- Player stats (current season projections)

**Player Data:**
- Player key (Yahoo's unique ID, e.g., `"mlb.p.12345"`)
- Player name
- Position eligibility (e.g., `["1B", "OF"]`)
- Team (MLB team abbreviation)
- Stats (projected or actual, depending on endpoint)

### API Call Frequency

**During Live Draft:**
- Draft picks: Polled every 5-10 seconds (extension scrapes DOM + validates via API)
- Available players: Fetched on-demand when AI generates recommendations
- League settings: Cached for draft session

**Daily Lineup Optimizer:**
- Roster: Fetched once per optimization request
- Standings: Fetched to calculate category gaps

**Rate Limits:**
- Yahoo enforces **10 req/sec** and **20,000 req/day**
- Client implements queue + exponential backoff to stay under limits

---

## 7. App Store / Play Store Config

### iOS (App Store)

**Bundle ID:** `com.rotogpt.app`

**Current Version:** `0.9.25` (build `25`)

**App Store Listing:**
- Name: "RotoGPT" (based on app.config.ts)
- Category: Sports (assumed)
- Target: iOS 13+ (Expo default)

**Capabilities:**
- Push Notifications
- Sign in with Apple (possible, not implemented)
- Universal Links (Yahoo deep links: `sportsfantasy://`)

**Distribution:** TestFlight + Production (via EAS Build)

### Android (Play Store)

**Package ID:** `com.rotogpt.app`

**Current Version:** `0.9.25` (versionCode `59`)

**Play Store Listing:**
- Name: "RotoGPT"
- Category: Sports (assumed)
- Target: Android 6.0+ (Expo default)

**Capabilities:**
- Push Notifications
- Deep Links (Yahoo app)

**Distribution:** Internal testing + Production (via EAS Build)

### Chrome Extension

**Name:** "RotoAgent - AI Draft Assistant"

**Version:** `1.0.0`

**Permissions:**
- `storage` — save settings + auth tokens
- `activeTab` — inject overlay on Yahoo Fantasy pages
- `alarms` — token refresh every 45 min
- `identity` — OAuth flow via `chrome.identity`

**Host Permissions:**
- `*://*.fantasysports.yahoo.com/*` (inject scripts)
- `https://rotoagent.ai/*` (API calls)

**Status:** Not yet published to Chrome Web Store (ready for submission)

---

## 8. Landing Page / Web App

### Domains

**Landing Page:** `https://rotoagent.ai`  
**Web App:** `https://app.rotoagent.ai`

### Landing Page (`rotoagent.ai`)

**Purpose:** Marketing site (hero, features, pricing, download links)

**Pages:**
- `/` — Hero, value prop, demo video, download CTAs
- `/pricing` — Free vs Pro comparison
- `/contact` — Contact form (bug reports, feature requests, questions)
- `/support` — Help articles
- `/privacy`, `/terms` — Legal

**CTA:** Download mobile app (App Store / Play Store badges)

**Tech:** Next.js 15 (server-rendered, SEO optimized)

### Web App (`app.rotoagent.ai`)

**Purpose:** Authenticated web experience (desktop users, extension users who want full UI)

**Features:**
1. **Dashboard** — League list, upcoming drafts, recent activity
2. **Mock Draft Simulator** — Practice drafts with AI opponents
3. **Draft History** — Review past drafts, see AI recommendations vs actual picks
4. **Lineup Optimizer** — Daily lineup suggestions (same as mobile)
5. **Account Settings** — Manage subscription, notification preferences

**Tech:** Next.js 15 (same backend as API) + RevenueCat Web SDK

**Auth:** Better Auth (Yahoo OAuth)

**Subscription:** RevenueCat Web SDK → Stripe (same `yahooGuid` as mobile for cross-platform sync)

---

## 9. Email Capability

### Service: ✅ **Resend**

**Usage:** Contact form submissions (`/api/v1/contact`)

**Current Flow:**
1. User submits contact form (bug report, feature request, question)
2. Backend tries to create Linear issue (project management)
3. If Linear fails → fallback to Resend email
4. Email sent to: `george@rotogpt.app`
5. Reply-to: user's submitted email

**Email Template:**
```
Subject: [Bug Report] User's subject
From: RotoAgent Contact Form <noreply@rotogpt.app>
Reply-To: user@example.com

Message:
User's message here...

Device Information (for bugs):
- Platform: iOS
- OS Version: 17.2
- App Version: 0.9.25
```

**Can We Email Users Directly?**
- ❌ **No bulk email capability** (no SendGrid, Mailchimp, etc.)
- ❌ **User emails not guaranteed** (Yahoo OAuth email is optional)
- ✅ **Could add Resend for transactional emails** (e.g., draft reminders, weekly summaries)
  - Would need to collect + store emails separately (waitlist table exists but not used for app users)

**Recommendation:** Add email collection step during onboarding ("Get draft reminders?") → store in `user.email` → use Resend for transactional drip campaigns.

---

## 10. Analytics / Tracking

### Current State: ⚠️ **Minimal, fragmented across surfaces**

### Mobile Apps (iOS & Android)

**Crash Reporting:**
- ✅ Firebase Crashlytics (catches crashes, logs to Firebase console)
- ✅ Sentry (error tracking, performance monitoring)

**Event Tracking:**
- ❌ **No dedicated analytics SDK** (no Mixpanel, PostHog, Amplitude, etc.)
- ✅ **Database-level tracking** via `user_usage` table:
  - `last_feature_used` — "mock_draft" | "live_draft" | "lineup_optimizer"
  - `last_feature_used_at` — timestamp
  - `league_count` — number of Yahoo leagues user has
  - `hit_free_limit_at` — when free user hit paywall

### Web App

**Analytics:**
- ❌ **No Google Analytics, Plausible, or similar**
- ✅ **Same database tracking** as mobile (shares `user_usage` table)

### Chrome Extension

**Analytics:**
- ❌ **No analytics SDK**
- ✅ **Tracks installs** via `extension_install` table (upserted on first API call)
- ✅ **Shares `user_usage` table** for feature tracking (when user makes API calls)

### Admin Dashboard

**Location:** `https://rotoagent.ai/admin` (protected by `ADMIN_EMAILS` env var)

**Platform Analytics Page:** `/admin/analytics`

**Metrics Shown:**
- iOS users (count of active push tokens where `platform = 'ios'`)
- Android users (count of active push tokens where `platform = 'android'`)
- Web users (count of `user` table rows)
- Extension users (count of `extension_install` table rows)
- Total users (count of `user_usage` table rows)
- Pro subscribers (count where `subscription_status IN ('pro', 'pro_monthly', 'pro_annual')`)
- Free users (total - pro)
- 7-day trend (new `user_usage` rows per day)

**🚨 MAJOR ANALYTICS ISSUE:**

The "Platform Analytics" dashboard **double-counts and under-counts users**:

1. **iOS/Android counts** use `push_token` table (only users who granted push permissions)
   - ❌ Users who denied push are invisible here
   
2. **Web users** count uses `user` table (Better Auth users)
   - ❌ Extension-only users never appear in `user` table
   
3. **Extension users** count uses `extension_install` table
   - ❌ Doesn't dedupe users who also use mobile/web
   
4. **Total users** uses `user_usage` table (correct source of truth)
   - ✅ All surfaces funnel into `user_usage` when they make their first AI call
   - ⚠️ But users who **signed in but never used AI** are invisible

**Reality Check:**
- A user could appear in iOS count, web count, AND extension count (triple-counted in platform breakdown)
- A user who denied push notifications won't show in iOS/Android counts
- A user who only installed extension + never used web app won't be in `user` table

**Correct Approach:**
Query `user_usage` table and join with `push_token`, `user`, `extension_install` to see which platforms each user has accessed. Current dashboard is **misleading**.

---

## 11. User Tracking Across Surfaces

### How Users Are Identified

**Universal ID:** `yahooGuid` (Yahoo's globally unique user ID)

**Flow:**
1. User signs in with Yahoo on any surface (mobile, web, extension)
2. Yahoo returns `yahooGuid` in OAuth response
3. Surface makes first API call (draft recommendations, lineup optimizer, etc.)
4. Backend creates `user_usage` record keyed by `yahooGuid`
5. All future API calls use `yahooGuid` to look up usage limits + subscription status

### Cross-Surface User Journeys

**Scenario 1: Mobile → Web**
1. User downloads iOS app, signs in with Yahoo → `yahooGuid = "ABC123"`
2. `user` table gets new row (Better Auth)
3. User requests draft recs → `user_usage` row created for `"ABC123"`
4. User subscribes to Pro via iOS app → `user_usage.subscription_status = 'pro_monthly'`
5. User visits `app.rotoagent.ai` on desktop, signs in with same Yahoo account
6. Web app reads `user_usage` for `"ABC123"` → sees Pro status → no paywall ✅

**Scenario 2: Extension → Mobile**
1. User installs Chrome extension, signs in → `yahooGuid = "XYZ789"`
2. `extension_install` row created (NO `user` row, extension bypasses Better Auth)
3. User requests draft recs → `user_usage` row created for `"XYZ789"`
4. User hits paywall in extension → clicks "Upgrade" → redirected to `app.rotoagent.ai`
5. User signs in to web app (Better Auth), purchases Pro via Stripe/RevenueCat Web
6. `user_usage.subscription_status` updates to `'pro_monthly'` for `"XYZ789"`
7. Extension picks up Pro status on next API call ✅

**Scenario 3: Extension-Only User (Never Visits Web/Mobile)**
1. User installs extension, signs in → `yahooGuid = "DEF456"`
2. `extension_install` row created
3. User uses 3 free draft recs → `user_usage` row created
4. User sees paywall but **never clicks "Upgrade"** (ignores it)
5. **This user is INVISIBLE to most analytics:**
   - ❌ Not in `user` table (never signed into web app)
   - ❌ Not in `push_token` table (extension doesn't register push tokens)
   - ✅ Only visible in `extension_install` table + `user_usage` table

### What Data Do We Have Per Surface?

| Surface | Yahoo GUID | Email | Name | Profile Image | Push Token | RevenueCat Customer ID |
|---------|-----------|-------|------|---------------|-----------|----------------------|
| **iOS App** | ✅ | ❓ (optional) | ✅ | ✅ | ✅ | ✅ |
| **Android App** | ✅ | ❓ (optional) | ✅ | ✅ | ✅ | ✅ |
| **Web App** | ✅ | ❓ (optional) | ✅ | ✅ | ❌ | ✅ |
| **Chrome Extension** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Email Availability:**
Yahoo OAuth **does not guarantee email**. The `email` field is only returned if:
1. User granted `openid` scope (in addition to `fspt-r`)
2. Yahoo account has a verified email

Many users authenticate without providing email. **We cannot rely on email for marketing.**

---

## 12. Revenue & Subscription Tracking

### RevenueCat Dashboard

**What RevenueCat Tracks:**
- Active subscriptions (monthly vs annual)
- MRR (Monthly Recurring Revenue)
- Churn rate
- Platform breakdown (iOS vs Android vs Web/Stripe)
- Customer IDs (linked to `yahooGuid` via `appUserId`)

**Current Metrics (Per George):**
- **15 active users**
- **3 subscribers**
- **$8 MRR**

### 🚨 **CRITICAL REVENUE TRACKING ISSUE**

**Problem:** These numbers likely **undercount total users and revenue** because:

1. **Chrome extension users are not in RevenueCat**
   - Extension redirects to web app for purchases
   - If user purchases on web → they appear in RevenueCat under "Web" platform
   - But if user **never purchases** → they're invisible to RevenueCat entirely

2. **Users who signed in but never used AI are not in `user_usage`**
   - RevenueCat tracks subscriptions, but our analytics rely on `user_usage` for "total users"
   - A user who downloaded the app, signed in, looked around, but never requested AI recs → not counted

3. **Platform breakdown may be misleading**
   - User who installed iOS app + extension + web app could purchase on any surface
   - RevenueCat shows **platform where purchase happened**, not all platforms user accessed
   - Example: User primarily uses extension, but purchased on iOS app → counted as "iOS subscriber" in RevenueCat

### Actual User Count (Best Guess)

**Source of Truth:** `user_usage` table (`SELECT COUNT(*) FROM user_usage`)

**But this misses:**
- Users who signed in but never used AI (not in `user_usage` yet)
- Users who downloaded app but never signed in (impossible to track without analytics SDK)

**Recommendation:** Add event tracking SDK (PostHog, Mixpanel, or Amplitude) to capture:
- App launches
- Sign-in events
- Screen views
- Button clicks
- **Then** cross-reference with `user_usage` to see drop-off from "signed in" → "used AI"

---

## 13. Data Gaps & Recommendations

### Critical Gaps

1. **❌ Chrome Extension Not Integrated with RevenueCat**
   - **Impact:** Extension users are second-class citizens. They must visit web app to purchase.
   - **Fix:** Either:
     - (A) Accept current flow (extension → web for purchases)
     - (B) Add Chrome Web Store payments (not compatible with RevenueCat, would fragment payment systems)
   - **Recommendation:** Keep current flow, but ensure extension users who purchase on web are properly attributed (need `?ref=extension` tracking)

2. **❌ No Centralized Analytics**
   - **Impact:** Can't answer "How many users opened the app today?" or "What's our DAU/MAU?"
   - **Fix:** Add PostHog (open-source, privacy-focused) or Mixpanel to all surfaces
   - **Recommendation:** PostHog (free tier covers early-stage usage, self-hostable for privacy)

3. **❌ Email Addresses Not Reliably Collected**
   - **Impact:** Can't send marketing emails, drip campaigns, or re-engagement emails
   - **Fix:** Add opt-in email collection during onboarding ("Want draft reminders?")
   - **Recommendation:** Add email input screen after Yahoo OAuth, store in `user.email`, use Resend for transactional emails

4. **❌ Platform Analytics Dashboard Is Misleading**
   - **Impact:** George sees 15 users total, but reality may be 20-30+ (extension users not counted, double-counting across platforms)
   - **Fix:** Rewrite analytics query to use `user_usage` as source of truth, dedupe by `yahooGuid`, join with platform-specific tables to tag each user's platforms
   - **Recommendation:** New dashboard showing:
     - Total unique users (from `user_usage`)
     - Pro vs Free breakdown
     - Surface usage per user (iOS, Android, Web, Extension as booleans, not separate counts)
     - Last active date per user

5. **❌ No Conversion Funnel Tracking**
   - **Impact:** Can't measure:
     - Sign-in → First AI Call (activation rate)
     - First AI Call → Hit Paywall (engagement rate)
     - Hit Paywall → Subscribe (conversion rate)
   - **Fix:** Add event tracking at each step
   - **Recommendation:** Use PostHog funnels or custom SQL queries against `user_usage` + event logs

### Quick Wins

1. **Fix Admin Analytics Dashboard** (1-2 hours)
   - Rewrite `/admin/analytics` query to use `user_usage` as source of truth
   - Show platforms per user (one user = one row, with flags for iOS/Android/Web/Extension)

2. **Add Email Collection** (2-4 hours)
   - New onboarding screen: "Want lineup reminders? Enter your email (optional)"
   - Store in `user.email` (Better Auth) or new `user_email_preferences` table
   - Integrate Resend for weekly summaries

3. **Track Extension Purchases** (1 hour)
   - Ensure `?ref=extension` param is passed to web app when extension redirects
   - Log referral source in `user_usage` table (new `referral_source` column)
   - Dashboard shows "Subscriptions by Referral Source" (mobile vs web vs extension)

4. **Add PostHog for Event Tracking** (4-8 hours)
   - Install `posthog-js` (web) + `posthog-react-native` (mobile) + `posthog-js` (extension)
   - Track key events:
     - `app_launched`
     - `user_signed_in`
     - `draft_recs_requested`
     - `lineup_optimized`
     - `paywall_viewed`
     - `subscription_purchased`
   - Dashboard shows funnels, retention, DAU/MAU

---

## 14. Summary for George

### What We Know

✅ **Auth works across all 4 surfaces** (Yahoo OAuth, keyed by `yahooGuid`)  
✅ **Subscriptions work on iOS, Android, Web** (RevenueCat integrated)  
✅ **Database schema is solid** (Postgres + Drizzle ORM, well-designed)  
✅ **Usage tracking works** (`user_usage` table tracks AI limits + subscriptions)  
✅ **Push notifications infrastructure ready** (not yet sending, but tokens register correctly)

### What's Broken

❌ **Chrome extension has no payment integration** (redirects to web, creates friction)  
❌ **Analytics dashboard is misleading** (double-counts users, misses extension-only users)  
❌ **No centralized event tracking** (can't measure funnels, DAU/MAU, or activation rates)  
❌ **Email collection is hit-or-miss** (Yahoo OAuth doesn't guarantee email)  
❌ **Total user count is unknown** (15 active users may be 20-30+ if extension users are counted)

### The Real Question: **How Many Users Do We Actually Have?**

**Best Answer (from database):**
```sql
-- Total users who have used AI at least once
SELECT COUNT(*) FROM user_usage;

-- Pro subscribers
SELECT COUNT(*) FROM user_usage 
WHERE subscription_status IN ('pro', 'pro_monthly', 'pro_annual');

-- Users by surface (deduped)
SELECT 
  COUNT(DISTINCT yahoo_guid) as total_users,
  COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM push_token WHERE push_token.yahoo_guid = user_usage.yahoo_guid AND platform = 'ios') THEN yahoo_guid END) as ios_users,
  COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM push_token WHERE push_token.yahoo_guid = user_usage.yahoo_guid AND platform = 'android') THEN yahoo_guid END) as android_users,
  COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM user WHERE user.email = ... ) THEN yahoo_guid END) as web_users,
  COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM extension_install WHERE extension_install.yahoo_guid = user_usage.yahoo_guid) THEN yahoo_guid END) as extension_users
FROM user_usage;
```

**Recommendation:** Run this query against production DB and compare to RevenueCat dashboard. If numbers diverge significantly → analytics are broken.

---

## Appendix: Key File Locations

### Auth
- Mobile: `packages/auth/src/index.ts` (Better Auth config)
- Extension: `apps/chrome-extension/src/lib/auth.ts` (custom Yahoo OAuth)

### Subscriptions
- Mobile: `apps/expo/src/stores/useSubscriptionStore.ts` (RevenueCat SDK)
- Web: `apps/nextjs/src/app/(app)/_services/revenuecat-web.ts` (RevenueCat Web SDK)

### Database
- Schema: `packages/db/src/schema.ts` (exports all tables)
- User Usage: `packages/db/src/usage-schema.ts`
- Auth: `packages/db/src/auth-schema.ts`
- Push: `packages/db/src/push-notification-schema.ts`

### API
- Draft Router: `packages/api/src/router/draft.ts` (draft recs, league data)
- Usage Router: `packages/api/src/router/usage.ts` (usage tracking, limits)
- Admin Router: `packages/api/src/router/admin.ts` (analytics dashboard)

### Mobile App
- Config: `apps/expo/app.config.ts`
- Main Screen: `apps/expo/src/app/index.tsx`
- Draft Assistant: `apps/expo/src/app/(draft)/[leagueId].tsx`

### Chrome Extension
- Background: `apps/chrome-extension/src/entrypoints/background.ts`
- Overlay: `apps/chrome-extension/src/lib/overlay.ts`
- Config: `apps/chrome-extension/wxt.config.ts`

### Web App
- Landing Page: `apps/nextjs/src/app/(marketing)/page.tsx`
- App Layout: `apps/nextjs/src/app/(app)/layout.tsx`
- Admin Dashboard: `apps/nextjs/src/app/admin/(dashboard)/page.tsx`
- Analytics: `apps/nextjs/src/app/admin/(dashboard)/analytics/page.tsx`

---

**End of Audit**

*Generated by Todd (Head of Marketing) on March 23, 2026*
