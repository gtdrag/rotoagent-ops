const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const POSTGRES_URL = process.env.POSTGRES_URL || execSync(
  'security find-generic-password -a larry -s "openclaw/neon-postgres-url" -w',
  { encoding: "utf8" }
).trim();

const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    const now = new Date().toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = new Date().toLocaleTimeString("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      minute: "2-digit",
    });

    // Total registered users
    const users = await client.query(
      'SELECT COUNT(*) as total, COUNT(email) as with_email FROM "user"'
    );

    // Active users (have used AI)
    const usage = await client.query(
      "SELECT COUNT(*) as total FROM user_usage"
    );

    // Subscription breakdown
    const subs = await client.query(
      "SELECT subscription_status, COUNT(*) as cnt FROM user_usage GROUP BY subscription_status ORDER BY cnt DESC"
    );

    // Paid total
    const paid = await client.query(
      "SELECT COUNT(*) as total FROM user_usage WHERE subscription_status != 'free'"
    );

    // Extension installs
    const ext = await client.query(
      "SELECT COUNT(*) as total FROM extension_install"
    );

    // Push tokens by platform
    const push = await client.query(
      "SELECT platform, COUNT(DISTINCT yahoo_guid) as users FROM push_token WHERE is_active = true GROUP BY platform"
    );

    // New signups today
    const today = new Date().toISOString().split("T")[0];
    const newToday = await client.query(
      `SELECT COUNT(*) as total FROM "user" WHERE created_at::date = $1`,
      [today]
    );

    // New signups last 7 days
    const new7d = await client.query(
      `SELECT COUNT(*) as total FROM "user" WHERE created_at > NOW() - INTERVAL '7 days'`
    );

    // New signups last 28 days
    const new28d = await client.query(
      `SELECT COUNT(*) as total FROM "user" WHERE created_at > NOW() - INTERVAL '28 days'`
    );

    // Build platform map
    const platformMap = {};
    push.rows.forEach((r) => (platformMap[r.platform] = r.users));

    // Build sub breakdown
    const subBreakdown = {};
    subs.rows.forEach((r) => (subBreakdown[r.subscription_status] = r.cnt));

    const paidCount = parseInt(paid.rows[0].total);
    const activeCount = parseInt(usage.rows[0].total);
    const freeCount = activeCount - paidCount;

    const md = `# KPI Dashboard

Last updated: ${now} at ${timeStr} CT (auto-generated)

## Current Metrics (Production DB)

| Metric | Value | Notes |
|--------|-------|-------|
| Registered Users | ${users.rows[0].total} | All have emails |
| Active Users (used AI) | ${activeCount} | Made at least one AI call |
| Paying Subscribers | ${paidCount} | ${subBreakdown["pro_annual"] || 0} annual + ${subBreakdown["pro_monthly"] || 0} monthly |
| Free Users | ${freeCount} | |
| Conversion Rate | ${activeCount > 0 ? Math.round((paidCount / activeCount) * 100) : 0}% | Paid / active |
| iOS Users (push enabled) | ${platformMap["ios"] || 0} | Only counts push-accepted users |
| Android Users (push enabled) | ${platformMap["android"] || 0} | Only counts push-accepted users |
| Chrome Extension Installs | ${ext.rows[0].total} | |
| New Signups (today) | ${newToday.rows[0].total} | |
| New Signups (7 day) | ${new7d.rows[0].total} | |
| New Signups (28 day) | ${new28d.rows[0].total} | |
| iOS Reviews | 0 | Manual check needed |
| Android Reviews | 0 | Manual check needed |

## Subscription Breakdown

| Status | Count |
|--------|-------|
${subs.rows.map((r) => `| ${r.subscription_status} | ${r.cnt} |`).join("\n")}

## Surfaces

RotoAgent operates across 4 surfaces:
1. **iOS App** (App Store) — RevenueCat ✅, Push ✅, Better Auth ✅
2. **Android App** (Play Store) — RevenueCat ✅, Push ✅, Better Auth ✅
3. **Web App** (app.rotoagent.ai) — RevenueCat/Stripe ✅, Better Auth ✅
4. **Chrome Extension** — No RevenueCat (redirects to web), separate install tracking

## Targets

| KPI | Now | 30 Day | 60 Day | 90 Day |
|-----|-----|--------|--------|--------|
| Active Users | ${activeCount} | 55 | 165 | 440 |
| Paying Subs | ${paidCount} | 20 | 60 | 175 |
| Weekly Signups | ~${Math.round(parseInt(new7d.rows[0].total))} | 12 | 35 | 100 |
| iOS Reviews | 0 | 10+ | 25+ | 50+ |
| Android Reviews | 0 | 10+ | 25+ | 50+ |

## Data Sources
- **Production DB (Neon/Vercel Postgres):** User counts, subscriptions, usage, emails (source of truth)
- **RevenueCat:** Subscription management, MRR, churn
- **App Store Connect:** Downloads, impressions, search terms (API key configured)
- **Google Play Console:** Installs, ratings, retention (API key configured)

## Update Cadence
- Auto-updated daily at 8:00 AM CT via cron job
`;

    const kpiPath = path.join(__dirname, "..", "operations", "kpis.md");
    fs.writeFileSync(kpiPath, md);
    console.log("KPIs updated successfully");
    console.log(`  Registered: ${users.rows[0].total} | Active: ${activeCount} | Paid: ${paidCount} | Free: ${freeCount}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error("KPI update failed:", e.message);
  process.exit(1);
});
