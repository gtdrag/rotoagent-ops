# RotoAgent Growth Playbook — Week-by-Week Action Plan

**Target Market:** ~1.7M Yahoo Fantasy Baseball roto league players  
**Current State:** 15 active users, 3 paid subs, $8 MRR  
**Current UA:** 100% organic App Store search  

---

## 1. PLAY STORE PRICING FIX

### The Problem
Play Store listing appears to show $1.99 somewhere despite RevenueCat pricing being $4.99/mo and $24.99/yr on both platforms.

### Where to Check
1. **Google Play Console** → RotoAgent → Store presence → Main store listing → In-app products
   - Check if any legacy IAP SKUs are still visible/published
   - RevenueCat manages the actual purchase flow, but old IAP metadata can still display in listings
2. **"In-app purchases" section** in the Play Store listing itself
   - Download the app on Android (or use Play Store web view)
   - Check what prices show under "In-app purchases" before installing
3. **Google Play Console** → Store presence → Main store listing → Scroll to bottom → "Contains ads / In-app purchases"
   - Verify the price range shown matches $4.99-$24.99

### How to Fix
- **If it's a legacy IAP SKU:** Unpublish or archive the old $1.99 SKU in Google Play Console
- **If it's incorrect metadata in the listing description:** Edit Store Listing → update text
- **If RevenueCat is showing wrong prices:** Check RevenueCat Dashboard → Products → ensure Android product IDs map to correct Play Store SKUs with correct pricing

### Action This Week
- [ ] George or Larry: Log into Google Play Console and screenshot what's showing under "In-app purchases"
- [ ] Cross-reference with RevenueCat product configuration
- [ ] Update/unpublish as needed
- [ ] Verify on a test device within 24 hours

---

## 2. FREE TRIAL RECOMMENDATION

### Should You Do It?
**Yes. Add a 7-day free trial immediately.**

### Why
1. **Conversion rate lift:** Free trials typically increase conversion 2-4x for subscription apps. You're currently at 3/15 = 20% paid conversion, which is high for no trial. With a trial, you could realistically hit 30-40% of trial starters converting to paid.
2. **Lower friction:** Fantasy baseball is seasonal and emotional. People want to try it during a bad week and see if it helps before committing $5/mo.
3. **Competitive standard:** Most subscription apps in sports/fantasy space offer trials. Not having one makes you look less polished.
4. **RevenueCat makes it trivial:** You're already using RevenueCat, so implementation is just a configuration change.

### Implementation
- RevenueCat Dashboard → Products → Edit your monthly subscription → Enable "Free Trial" → Set to 7 days
- Update App Store & Play Store screenshots/description to mention "7-day free trial"
- Add trial messaging in your paywall UI (if not already dynamic from RevenueCat)

### Risks & Mitigation
- **Risk:** Trial abuse (people signing up, canceling, repeating)
  - **Mitigation:** RevenueCat tracks this by Apple ID / Google account. Trials are one-time per account by default.
- **Risk:** Lower immediate revenue
  - **Mitigation:** You're at $8 MRR. Short-term revenue isn't the constraint—user growth is.

### Action This Week
- [ ] Enable 7-day trial in RevenueCat (5 minutes)
- [ ] Update paywall copy if needed (30 minutes)
- [ ] Update App Store & Play Store listings to mention trial (1 hour)

---

## 3. REVIEW INCENTIVE IDEAS

### Context
You have 15 active users. You need reviews for App Store ranking and social proof. Current users are your best bet.

### What You Can (and Can't) Do

**Legal/Policy Constraints:**
- **Cannot:** Offer payment, credits, or in-app benefits in exchange for reviews (violates App Store & Play Store policies)
- **Cannot:** Require a review to unlock features
- **Can:** Ask for reviews at smart moments
- **Can:** Offer something valuable unrelated to the review itself, then ask separately

### Actionable Ideas

#### Idea 1: High-Conviction Moment Prompts
**What:** Trigger review prompt after a user's team has a great week (top 3 finish in their league standings for the week, or significant rank improvement)

**How:**
- If you track league standings: trigger in-app review prompt (StoreKit on iOS, Google Play In-App Review API on Android) when user's team moves up 3+ ranks or finishes in top 3 for the week
- Simple, non-intrusive native prompt
- No incentive needed—just good timing

**Effort:** Medium (requires tracking league performance data)

#### Idea 2: Direct Outreach to Current Paid Users
**What:** Personally email or message your 3 paid subscribers

**Message Template:**
> Hey [name],
>
> George here (I built RotoAgent). You've been using the app for [X weeks] and I wanted to say thanks for subscribing.
>
> Quick favor: if RotoAgent has helped your team, would you mind leaving a quick review on the App Store / Play Store? It makes a huge difference for a small app like this.
>
> Either way, appreciate the support. Let me know if there's anything I can do to make the app better for you.
>
> – George

**How:**
- Get email addresses from RevenueCat customer data or Apple/Google receipt info
- Send personally (not automated)
- 3 people = 3 emails, takes 10 minutes

**Expected result:** 1-2 reviews (33-66% conversion is realistic for direct asks from happy users)

**Effort:** Low (10 minutes)

#### Idea 3: Weekly Recap Email with Soft Ask
**What:** Send a weekly performance email to active users (summary of their team's stats, rank change, top players). End with a soft review ask.

**Template:**
> Your team finished #4 this week (up 2 spots). Your best player: [Player Name] with [stats].
>
> [Quick tips or insights based on their team]
>
> Enjoying RotoAgent? Leave us a review—it helps other fantasy players find the app.

**How:**
- Build simple email automation (SendGrid free tier = 100 emails/day)
- Trigger weekly on Monday after fantasy week ends
- Include review link at bottom

**Effort:** Medium-High (requires email automation + data pipeline)

**Timeline:** Week 3-4 implementation

#### Idea 4: Reddit/Community Soft Launch Post
**What:** Post about RotoAgent in r/fantasybaseball with a "built this tool, would love feedback" angle. Ask for reviews from anyone who tries it.

**Why it works:**
- Reddit users are more likely to leave reviews if they discover something organically
- Positions you as builder, not marketer
- Gets you both users AND reviews

**Template:**
> I built a tool that auto-manages Yahoo roto baseball lineups. It's called RotoAgent. Free 7-day trial if you want to check it out.
>
> Would love feedback—especially if you try it and have thoughts. If it's useful, an App Store review would be awesome.
>
> [link]

**Effort:** Low (30 minutes to write post)

**Timeline:** This week

### Recommendation: Do These in Order
1. **This week:** Direct email to 3 paid users (10 min) + Reddit post (30 min)
2. **Next week:** Implement high-conviction moment prompt (if feasible with current data)
3. **Week 3-4:** Build weekly recap email automation

---

## 4. PAID ADS — DETAILED BREAKDOWN

### Overview
Paid ads for a niche app like RotoAgent are high-risk, high-reward. You're targeting a small, specific audience (Yahoo roto baseball players). The good news: they're identifiable. The bad news: scale is limited and cost can get high fast.

### Platform Recommendations

#### Option 1: Reddit Ads (BEST FIT)
**Why:**
- r/fantasybaseball has 600k+ members
- Highly targetable (fantasy baseball interest)
- Users are in "help me win" mindset
- CPM is lower than Facebook/Google for niche interests

**Expected CPA:**
- **CPM:** $3-8 (cost per 1,000 impressions)
- **CTR:** 0.5-1.5% (niche apps with good creative)
- **Install rate:** 15-25% of clicks (if landing page is App Store)
- **Trial start rate:** 40-60% of installs (with 7-day trial enabled)
- **Paid conversion:** 15-25% of trial starters

**Math:**
- 1,000 impressions = $5 (average)
- 10 clicks (1% CTR)
- 2 installs (20% install rate)
- 1 trial start (50% trial rate)
- Cost per trial start: **$5**
- Cost per paid subscriber (20% conversion): **$25**

**Good vs. Bad:**
- **Good:** CPA under $30 for a $4.99/mo subscription (6-month payback)
- **Bad:** CPA over $50 (10-month payback is too long for a seasonal app)

**Budget:**
- **Test budget:** $200-300
- **Expected result:** 8-12 paid subs if metrics hit
- **Timeline:** 2 weeks (1 week setup, 1 week run)

#### Option 2: Facebook/Instagram Ads
**Why:**
- Detailed interest targeting (fantasy sports, baseball, Yahoo Fantasy)
- Large reach
- Good creative tools (video works well for app demos)

**Expected CPA:**
- **CPM:** $8-15 (higher than Reddit)
- **CTR:** 0.8-1.2%
- **Install rate:** 20-30%
- **Trial start rate:** 40-60%
- **Cost per trial start:** $8-12
- **Cost per paid subscriber:** $40-60

**Good vs. Bad:**
- **Good:** CPA under $50
- **Bad:** CPA over $75

**Budget:**
- **Test budget:** $300-500
- **Expected result:** 6-10 paid subs if metrics hit

#### Option 3: Google Ads (Search)
**Why:**
- High intent (people searching "fantasy baseball lineup optimizer" or "Yahoo fantasy baseball tool")
- Converts well when intent is clear

**Expected CPA:**
- **CPC:** $1-3 per click (depends on keyword competition)
- **Install rate:** 25-35% (higher intent than social)
- **Trial start rate:** 50-70%
- **Cost per trial start:** $5-10
- **Cost per paid subscriber:** $25-50

**Good vs. Bad:**
- **Good:** CPA under $40
- **Bad:** CPA over $60

**Budget:**
- **Test budget:** $200-400
- **Expected result:** 6-12 paid subs if metrics hit

**Challenges:**
- Search volume may be low (not many people searching this exact thing)
- Seasonal spikes (early season = high volume, mid-season = low)

### Recommendation: Start with Reddit
**Why:**
1. Lowest minimum spend ($200 vs. $300-500 for Facebook/Google)
2. Best audience fit (fantasy baseball enthusiasts actively browsing community)
3. Easier creative (text post + image vs. video for Facebook)
4. Lower CPA expected

### First Test Campaign Plan (Reddit)

#### Week 1: Setup & Creative
**Actions:**
- [ ] Create Reddit Ads account
- [ ] Set up conversion tracking (Reddit Pixel on App Store listing or use deep link with tracking)
- [ ] Write 3 ad variations (test different hooks)
- [ ] Design 1-2 simple image creatives (screenshot of app + headline)

**Ad Copy Ideas:**
1. "Tired of setting Yahoo lineups every day? RotoAgent auto-optimizes your roto team. 7-day free trial."
2. "Your roto team on autopilot. RotoAgent syncs with Yahoo and manages your lineup daily. Try it free for 7 days."
3. "Winning your roto league takes daily lineup moves. RotoAgent does it for you. Free trial."

**Targeting:**
- Subreddit: r/fantasybaseball
- Optional: r/baseball (broader, but lower intent)

**Budget:**
- $15/day for 14 days = $210 total

#### Week 2: Run & Monitor
**Actions:**
- [ ] Launch campaign
- [ ] Check daily: CTR, CPM, installs, trial starts (if trackable via RevenueCat webhooks)
- [ ] Pause if CPA is tracking >$60 by day 5
- [ ] Let run if CPA is <$40

**Success criteria:**
- 40+ clicks
- 8+ installs
- 4+ trial starts
- 1-2 paid conversions within 7 days of trial start

#### Week 3: Evaluate & Iterate
**If it worked (CPA <$40):**
- Increase budget to $30/day
- Expand to r/baseball or other related subreddits
- Test new creative

**If it didn't work (CPA >$60):**
- Analyze where drop-off happened (CTR? Install rate? Trial rate?)
- Adjust creative or targeting
- Consider testing Facebook or Google instead

### What "Good" Looks Like
For a $4.99/mo subscription with ~60% monthly retention (industry average), lifetime value (LTV) is roughly $30-40.

**Target CPA:** $25-35 (gives you a margin)  
**Acceptable CPA:** $40-50 (breakeven-ish)  
**Bad CPA:** $60+ (losing money)

**Early-stage reality:** You'll probably be at the high end ($40-60) for the first few campaigns. That's fine for learning. Once you find what works, you can optimize down.

---

## 5. ACTIVE USER ACQUISITION PLAN

### Current State
100% organic App Store search. Zero active marketing.

### Goal
Build 3-4 repeatable channels that drive 20-50 new users/month within 8 weeks.

### Week-by-Week Plan

---

### **WEEK 1: Foundation + Quick Wins**

#### 1. Fix Play Store Pricing (Day 1)
- Action: Investigate and fix $1.99 display issue
- Owner: George/Larry
- Time: 1-2 hours

#### 2. Enable 7-Day Free Trial (Day 1-2)
- Action: Enable in RevenueCat, update store listings
- Owner: George/Larry
- Time: 2 hours

#### 3. Direct Outreach to Current Paid Users (Day 2)
- Action: Email 3 paid subs asking for reviews
- Owner: George
- Time: 15 minutes

#### 4. Reddit Soft Launch Post (Day 3-4)
- Action: Post in r/fantasybaseball (see template in section 3)
- Owner: Todd (draft) → George (post from personal account)
- Time: 30 minutes
- Expected: 5-15 installs, 1-3 reviews

#### 5. Optimize App Store Listing (Day 4-5)
- Action: Update screenshots, description, keywords to emphasize free trial + auto-lineup management
- Owner: Larry (screenshots) + Todd (copy)
- Time: 3 hours
- Keywords to target: "Yahoo fantasy baseball," "lineup optimizer," "roto helper," "fantasy baseball automation"

**Expected Week 1 Results:**
- 5-15 new installs (from Reddit post)
- 1-3 App Store reviews (from paid user outreach)
- Free trial enabled (increases conversion going forward)

---

### **WEEK 2: Paid Ads Setup + Community Presence**

#### 1. Set Up Reddit Ads Campaign (Day 1-3)
- Action: Create account, build creatives, write ad copy, set up tracking
- Owner: Todd (setup) + George (account/payment)
- Time: 4 hours
- Budget: $210 ($15/day for 14 days, starting Week 3)

#### 2. Post in Niche Communities (Day 2-4)
- Communities:
  - r/YahooFantasy (smaller, but 100% relevant)
  - Fantasy baseball Discord servers (search "fantasy baseball Discord" and join 2-3 active ones)
  - RealTime Fantasy Sports forums (if still active)
- Action: Soft launch post (similar to Reddit template)
- Owner: George (authentic founder voice)
- Time: 1 hour total

#### 3. Build Landing Page for Paid Ads (Day 4-5)
- Action: Simple page (rotoagent.ai/trial or similar) that explains the app + directs to App Store/Play Store
- Owner: Larry
- Time: 3 hours
- Content: Headline, 3 benefits, screenshot, "Start 7-day trial" CTA

**Expected Week 2 Results:**
- 10-20 new installs (from community posts)
- Reddit Ads ready to launch Week 3

---

### **WEEK 3: Paid Ads Launch + Content**

#### 1. Launch Reddit Ads Campaign (Day 1)
- Action: Turn on campaign, monitor daily
- Owner: Todd (monitoring) + George (budget decisions)
- Time: 15 min/day to check metrics

#### 2. Write "How I Built This" Post (Day 2-4)
- Action: Write medium-length post for r/SideProject, r/EntrepreneurRideAlong, IndieHackers
- Angle: "Built an app for Yahoo fantasy baseball, here's what I learned"
- Include metrics (15 users, 3 paid, building in public)
- End with soft CTA (link to app)
- Owner: George (authentic) or Todd (draft → George edits)
- Time: 2 hours

#### 3. Post on X/Twitter (Day 5)
- Action: Tweet about RotoAgent with screenshot + link
- Angle: "Spent [X months] building an app that auto-manages Yahoo fantasy baseball lineups. Just hit [X users]. If you play roto, give it a shot—7-day trial."
- Owner: George
- Time: 15 minutes
- Hashtags: #FantasyBaseball #YahooFantasy #IndieDev

**Expected Week 3 Results:**
- 20-40 new installs (10-20 from Reddit Ads, 5-10 from posts, 5-10 organic)
- 2-4 trial starts from ads
- Some social engagement (retweets, replies)

---

### **WEEK 4: Optimize Ads + Build Email Automation**

#### 1. Review Reddit Ads Performance (Day 1-2)
- Action: Analyze CTR, CPA, install rate
- Decision: Continue, adjust creative, or pause
- Owner: Todd (analysis) + George (decision)
- Time: 1 hour

#### 2. Build Weekly Recap Email (Day 2-5)
- Action: Set up SendGrid, build email template, automate based on user league data
- Owner: Larry
- Time: 6 hours
- Content: Team rank, top players, quick tip, soft review ask

#### 3. Post in More Communities (Day 3-4)
- Communities:
  - Product Hunt (if app is polished enough)
  - Hacker News "Show HN" (risky but high upside if it resonates)
- Owner: George
- Time: 1 hour

**Expected Week 4 Results:**
- 15-30 new installs (continued from ads + organic boost from previous posts)
- Email automation live (increases engagement + reviews over time)

---

### **WEEK 5-8: Scale What Works**

#### Goals:
1. **If Reddit Ads worked (CPA <$50):** Increase budget to $30/day, expand to Facebook or Google
2. **If Reddit Ads didn't work:** Double down on organic community posting + content
3. **Continue posting weekly** in relevant subreddits (not spammy, just helpful presence)
4. **Ship weekly recap email** to all active users
5. **Test Product Hunt launch** (if app has 50+ users and 10+ reviews by then)

#### Weekly Actions (Weeks 5-8):
- [ ] Post in 1-2 new communities per week (Discord, forums, subreddits)
- [ ] Monitor paid ads daily, optimize or kill
- [ ] Send weekly recap email (automated)
- [ ] Engage with users who leave reviews or post about the app

**Expected Week 5-8 Results:**
- 50-100 new installs (if ads work)
- 20-40 new installs (if organic only)
- 5-10 paid subs (cumulative from trials)
- 10-15 App Store reviews

---

## Summary: What You're Doing

### This Week (Week 1)
- Fix Play Store pricing
- Enable 7-day trial
- Email 3 paid users for reviews
- Post in r/fantasybaseball
- Optimize App Store listing

### Next Week (Week 2)
- Set up Reddit Ads
- Post in niche communities (Discord, forums)
- Build simple landing page

### Week After (Week 3)
- Launch Reddit Ads
- Write "how I built this" post
- Tweet about it

### Ongoing
- Monitor ads, optimize or kill
- Post in communities weekly
- Ship weekly recap email
- Keep building

---

## Key Metrics to Track

**Weekly:**
- New installs (organic vs. paid)
- Trial starts
- Trial → paid conversion rate
- CPA (if running ads)
- App Store ranking for "fantasy baseball" and "Yahoo fantasy"

**Monthly:**
- MRR
- Churn rate
- LTV
- Reviews (count + average rating)

---

## Final Notes

This is aggressive but doable. You're not spending big money ($200-300 on ads max in first month). Most of this is sweat equity—posting in communities, emailing users, writing content.

The bottleneck isn't budget. It's consistency. If George or Larry can commit 3-5 hours/week for the next 8 weeks on marketing (posting, monitoring ads, engaging with users), you'll 3-5x your user base.

If you hit 50+ active users and 10+ paid subs by mid-season, you're in a position to scale harder (more ad spend, Product Hunt, maybe even influencer outreach to fantasy baseball YouTubers).

Let me know what you want to adjust or where you need more detail.

– Todd
