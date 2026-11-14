# What the numbers said

Newest week on top. The weekly planner adds an entry every time it plans, from `content/analytics/log.csv`.

## Week of 2026-11-14

- **The sample is still too small and too young to support a pattern. Only one post (070) is new since the last audit, and the metrics that would grade a hook are still missing.**
  - **Sample.** 37 posts from Oct 18 to Nov 13. 15 posts came after the one-a-day start (Oct 30), and 9 of those are at least 7 days old. 070 is under a day old, and 069 is 2 days old.
  - **Median.** The given 1,264 is correct this time. With 37 posts it is the 19th post, which is 069 itself.
  - **Multiples rose without new views.** The median fell from 1,351 to 1,264, so every multiple went up about 7%. 011 stayed at 2,231 views but moved from 1.65x to 1.77x. Compare views or cluster membership across audits, not multiples.
  - **Still missing, for the sixth audit running:** hold at 3s, non-follower share and Insights follows (`follows` is null on all 37 posts). I also did not read the episode files this session, so topics and hooks below are guessed from titles and slugs.
  - **Dataset gaps.** Mum asks parts 2 and 4 are still missing, and so are shop days 1 to 5.
  - Confidence: high that no strong pattern can be drawn from this data.

- **Top 5 and bottom 5 by outlier multiple, top by sends, and follows.**
  - **Top 5** (the same five as last week):
    - 011 "Cancel politely": 1.77x, Claude turn, 21.8s
    - 003: 1.69x, Gemini, 16.9s
    - 060 "Boss at eleven": 1.67x, Claude, 17.4s
    - 019: 1.59x, Gemini, 17.8s
    - 014: 1.55x, Codex, 14.6s
    - Average watch is 17.7s. **None of the five has a share.** Four of the five are old format.
  - **Bottom 5:**
    - 022: 0.11x, 7.8s
    - 061 "Mum asks: agent": 0.12x, 6.6s
    - 065 "Appraisal on Monday" (REAL FIX 1): 0.12x, 10.1s
    - 070 "Day one of leave" (AFTER HOURS 1): 0.13x, 11.2s. It is under a day old, so it is not ranked.
    - 005: 0.13x, 11.4s
    - Average watch is 9.4s.
  - **Top by sends** (shares = shares per 1k × reach):
    - 004: 6 shares (7.9 per 1k)
    - 044: 5 (4.2 per 1k)
    - 009: 4 (3.6 per 1k)
    - 067: 2 (2.1 per 1k)
    - 018: 2 (1.5 per 1k)
    - 008: 1 (0.9 per 1k)
    - That is 20 shares in total, unchanged since last week. 067's 2 are still the only shares since the reset. By turn, shares split Gemini 10, Claude 7, Codex 3.
  - **Follows** (next-day net change, ranked first as asked):
    - +1 each on 066 "Mum asks: the PIN" and 062 "Gift for the boss"
    - −1 on 067
    - 0 on the other 12 posts since Oct 30, including 070
    - That is +2 gross and +1 net. This is too few to rank anything.
  - **Saves.** There are 6 saves since the reset (058, 065, 066, 067 ×2, 069), and none are new since last week.
  - Confidence: high on the counts. Low on anything drawn from them.

- **What separates top from bottom is still whether a reel gets the first test group. The episode predicts it, not the series. Watch time follows the cluster, and the data cannot yet say which causes which.**
  - **Two clusters.** 19 posts land at 1,264 to 2,231 views, 004 sits alone at 1,080, and 17 posts land at 136 to 684.
  - **Watch time by cluster.** The high cluster averages 16.3s and the low cluster 11.5s (10.8s without 007 and 053, which held people on little reach).
    - Without hold at 3s, we cannot tell whether the hook lost people or the reel was shown to colder viewers.
  - **The day-2 read keeps holding.** Views barely moved after day 1:
    - 069: about 1,256 to 1,264
    - 067: 1,351 to 1,351
    - 066: about 1,419 to 1,422
    - 065: about 149 to 154
    - No post since the reset has changed cluster after day 1. Medium confidence (about 10 posts tracked).
  - **Who delivered the turn, all time** (n=12 each). Every member has posts in both clusters, so none of them is a lever:
    - Gemini: 1.00x mean, 0 of 3 in the high cluster since the reset
    - Claude: 0.92x mean, 3 of 7
    - Codex: 0.62x mean, 1 of 4, and bimodal (5 posts at 1.07 to 1.55x, 7 at 0.11 to 0.25x)
  - **A digit in the hook is not enough on its own** (from slugs, unverified): 003 "ninety-two percent" and 060 "boss at eleven" landed high, while 068 "thirty-seven orders" and 070 "sixty-three messages" landed low. Low confidence.
  - **Topic lead** (titles only). The new-format high posts are concrete rules or fixes that protect something people own:
    - 066: a PIN is never needed to receive money
    - 069: real jobs don't charge a joining fee
    - 067: storage full
    - Every Mum asks post that explains an AI word or an AI threat landed low, 5 of 5 at 0.12 to 0.26x: prompt, made up, agent, voice clone and fake video.
    - Low-medium confidence. It is title-level only, but 5 of 5 against 1 of 1 is the cleanest split we have.
  - **Day and time, checked last, still shows nothing for reach.** 066 posted at 22:57 IST and landed high. 070 posted at 21:45 IST and landed low.

- **Series vs series, and new format vs old.**
  - **Old "Hey committee"** (n=20): median 1.25x, 14 of 20 in the high cluster, 13 shares.
  - **Since Oct 30** (n=15): median 0.25x, 4 of 15 in the high cluster.
    - Among correctly tagged posts since Nov 7: 3 of 7 high, which was 3 of 6 last week.
    - The reach slide still predates the reset, so the old format's lead does not prove the new format caused the drop.
  - **REAL FIX** (n=3): 1.07x, 1.00x and 0.12x, a median of 1.00x.
    - It has 2 of the 2 shares and 4 of the 6 saves since the reset, but −1 net follows and 0 comments.
    - It is the best new series. Low confidence (n=3).
  - **MUM ASKS** (n=6): median 0.20x. 066 at 1.13x is the only post in the high cluster, and it is also the only money-rule topic in the series (see above).
  - **SAME PROMPT** (n=6, retired): median 0.41x. Closed.
  - **AI RUNS MY SHOP** (n=1): 068 at 0.17x. It cannot be read.
  - **AFTER HOURS** (n=1): it finally shipped, after missing its slot for two weeks. 070 is at 0.13x, 130 reach and 11.2s watch at under a day old.
    - It cannot be read yet. On the day-2 evidence above, it will probably stay in the low cluster.
    - It also went out at 21:45 IST, not 20:00. If the week began on Nov 13, it took the slot the plan gave to a real fix.
  - **The experiments are unread:**
    - Keyword on screen: n=0, because no real fix has shipped since the strategy was written.
    - Gemini delivering the fix: still 1 Gemini post (065) against 2 Claude/Codex posts (067, 069).
  - Confidence: medium that the episode, not the series, decides the cluster. Low on every per-series number.

- **Views without follows is still the main problem, and it is a profile and payoff problem, not a hook problem.**
  - **The four reels that travelled.** 060, 066, 067 and 069 together have 6,144 views and 4,475 reach. The account has about 10 followers, so nearly all of that reach was non-followers.
    - Between them: 0 net follows, 0 comments, 0 keyword comments.
  - **Conversion since the reset:**
    - 2 gross follows from 9,193 views is 0.22 per 1k views. The benchmark pages convert 8 to 9 per 1k, about 40 times more.
    - Net follows per 1k reach: 1 from 6,870 reach, or 0.15.
  - **Comments.** The only comments on the account are 2 on 015, posted Oct 24. All 15 posts since the reset have 0, including the 3 real fix posts with a keyword prize.
  - **Profile.** There is still no record that `/ig-profile` has run. This is the fourth audit asking for it.
  - Confidence: medium that conversion, not reach, is the bottleneck (n=4 travelling reels). Low on whether the cause is the profile, the prize or where the keyword appears.

- **STOP, DO MORE, and before the next audit.**
  - **STOP:** posting off the 20:00 IST slot. 070 went out at 21:45 and 066 at 22:57. The reason is clean attribution of `followers_gained_next_day`, not reach. High confidence that it muddies the data. No evidence that it hurts reach.
  - **STOP:** Mum asks topics that explain an AI word or an AI threat (prompt, made up, agent, voice clone, fake video: 5 of 5 low). Keep Mum asks for "never do this" money rules in the 066 shape. Low-medium confidence, titles only.
  - **STOP:** reading multiples across audits. Use views, or which cluster a post is in.
  - **STOP:** judging AFTER HOURS on 070 before day 2.
    - If it is still under 0.3x on Nov 15, give that test slot back to REAL FIX next week. Do not declare the series dead on n=1.
    - The bible allows one test a week, and a second after hours episode would only repeat a test we cannot read yet.
  - **DO MORE:** REAL FIX at 4 a week. It has 2 of 3 posts in the high cluster and all of the shares and most of the saves since the reset. Low confidence (n=3).
  - **DO MORE:** single-rule money and loss topics (066, 069, and 067's "something you own is about to be lost"). Check the episode files first. Low confidence.
  - **DO MORE:** run both experiments as designed, because both are still at n=0 or n=1:
    - The keyword on the final laptop screen in real fix posts 2 and 4
    - One Gemini real fix in a caption-only slot
  - **DO MORE:** run `/ig-profile` before tonight's post. 4,475 non-follower reach that converted to 0 follows is the method's definition of a profile problem.
  - **Before the next audit:**
    - Pull hold at 3s, non-follower share and Insights follows.
    - Get retention graphs for 066 vs 061 (15.8s vs 6.6s average watch) and 067 vs 065 (14.8s vs 10.1s).
    - Read the episode files for 058, 061, 064 to 070. Check the hook text, the first line and when the fix reaches the laptop, against the 10s target.
    - Log keyword comments per post from day one.
    - Confirm whether the dataset is complete.
  - **For `/ig-plan`:** build the week from real fix plus money-rule Mum asks.
  - **For `/ig-viral`:** filter the swipe file to number-plus-loss hooks (money, a job, a phone's storage), and drop the AI-explainer formulas.

## Week of 2026-11-13

- **This is the first week we can read the series at all. The sample is still small and young, and the key metrics are still missing.**
  - **Sample.** 36 posts from Oct 18 to Nov 12. 14 came after the one-a-day start (Oct 30), and 8 of those are 7 or more days old. All 6 posts from this week (061, 065 to 069) are 0 to 6 days old, and 069 is under a day.
  - **The tags are fixed.** All 6 posts this week carry a real series tag. That gives us the first REAL FIX data (n=3) and the first AI RUNS MY SHOP data (n=1).
  - **Plan vs shipped.**
    - Planned: 4 real fix, 1 after hours, 1 mum asks, 1 shop.
    - Shipped: 3 real fix, 2 mum asks (061, 066), 1 shop and 0 after hours.
    - After hours has missed its test slot for the second week running.
  - **Still missing, fifth audit running:** hold at 3s, non-follower share and Insights follows (`follows` is null on all 36). I also did not read the episode files this session. Topics and hooks below are guessed from titles.
  - **Dataset gaps.** Mum asks parts 2 and 4 are not in the list. Shop days 1 to 5 are missing too, although 045 "shop day one" exists.
  - **Median check.**
    - With 36 posts the true median is 1,301.5: the average of the 18th post (1,351) and the 19th (1,252).
    - The multiples below use the 1,351 as given. True multiples are about 3.8% higher, and no ranks change.
    - The median fell from 1,491 last week because low posts keep piling up. That raises old posts' multiples without any new views: 011 went from 2,224 to 2,231 views but from 1.50x to 1.65x. Compare cluster membership across audits, not multiples.
  - Confidence: high that this data cannot support strong patterns.

- **Top 5 and bottom 5 by outlier multiple, top by sends, and follows.**
  - **Top 5:**
    - 011 "Cancel politely": 1.65x, Claude, old format, 21.8s
    - 003: 1.58x, Gemini, old, 16.9s
    - 060 "Boss at eleven": 1.56x, Claude, 17.4s
    - 019: 1.49x, Gemini, old, 17.8s
    - 014: 1.45x, Codex, old, 14.6s
    - Average watch is 17.7s. **None of the five has a share**, the same as last week.
  - **Bottom 5** (8 listed, because four posts tie at 0.16x):
    - 022: 0.10x, 7.8s
    - 061 "Mum asks: agent": 0.11x, 6.6s, our worst watch time ever
    - 065 "Appraisal on Monday" (REAL FIX 1): 0.11x, 10.1s
    - 005: 0.13x, 11.4s
    - 0.16x each: 017 (11.0s), 058 (9.8s), 052 (10.6s) and 068 "Day six" (SHOP, 10.9s)
    - Average watch is 9.8s. 5 of the 8 are new format.
  - **Top by sends** (shares = shares per 1k × reach):
    - 004: about 6 shares (7.9 per 1k)
    - 044: about 5 (4.2 per 1k)
    - 009: about 4 (3.6 per 1k)
    - **067 "Storage full" (REAL FIX 2): about 2 (2.1 per 1k)**
    - 018: about 2 (1.5 per 1k)
    - 008: 1 (0.9 per 1k)
    - That is 20 shares in total. **067's 2 are the first shares since Oct 28** and the only ones since the reset.
    - By turn, shares split Gemini 10, Claude 7, Codex 3.
  - **Follows** (next-day net change):
    - +1 on 066 "Mum asks: the PIN"
    - +1 on 062
    - −1 on 067
    - 0 on everything else since Oct 30
    - Ranked by follows, 066 leads. In practice these are single digits, so there is nothing to rank yet.
  - **Saves.** There are 6 saves since the reset, and 5 of them came this week: 067 had 2, and 065, 066 and 069 had 1 each.
  - Confidence: high on the counts. Low on anything drawn from them.

- **What separates top from bottom: still the first test group. The episode predicts it, not the series.**
  - **Two clusters, not a slope.** 19 posts land at 1,252 to 2,231 views and 16 land at 136 to 684. 004 (1,080) sits between them.
  - **Every series has posts in both clusters:**
    - Old format: 0.10 to 1.65x
    - SAME PROMPT tag: 0.19 to 1.56x
    - Mum asks: 0.11 to 1.05x
    - Real fix: 0.11 to 1.00x
  - **Watch time.** The high cluster averages 16.3s and the low cluster 11.5s (10.7s without 007 and 053).
    - 061 (6.6s) and 065 (10.1s) lost people early, which points at the hook.
    - Without hold at 3s, that is still as far as the data goes.
  - **No post jumped clusters after day 2.**
    - 052 went from about 209 to 210 views, 058 from about 209 to 211, 062 from 611 to 611, and 060 from about 2,102 to 2,107.
    - 063 grew from about 179 to 256 between day 1 and day 7, but it stayed in the low cluster.
    - Medium confidence (about 8 posts tracked). A day-2 read is safe for planning. Keep the 7-day rule for ranking.
  - **Topic lead (from titles only).**
    - The two Mum asks / real fix hits this week each seem to rest on a single "never do this" money rule: 066 (a PIN is never needed to receive money) and 069 (real jobs don't charge a joining fee).
    - The tech-threat scam posts flopped: 058 voice clone and 064 deepfake.
    - Low confidence until the hooks are compared in the files.
  - **Who delivered the turn.**
    - Since Oct 30, posts in the high cluster: Claude 3 of 7 (060, 066, 069), Codex 1 of 3 (067), Gemini 0 of 3 (053, 065, 068), twin 0 of 1.
    - All-time means: Gemini 0.94x (n=12), Claude 0.86x (n=12), Codex 0.62x (n=11).
    - Gemini's lead is still an old-format lead.
    - Low confidence: the turn is tangled with series (Gemini's three new-format turns were a retired tag, the first real fix and a shop day).
  - **Day and time, checked last, show nothing.**
    - 066 went out at 22:57 IST and landed high.
    - This week's 20:01 posts split 2 high (067, 069) and 3 low (061, 065, 068).
    - Keep 20:00 for attribution only.

- **Series vs series, and new format vs old.**
  - **Old "Hey committee"** (n=20): median 1.17x, 14 of 20 at or above 0.95x, 13 shares.
  - **Since Oct 30** (n=14): median 0.24x, 4 of 14 in the high cluster.
    - The first 8 posts: 1 of 8 in the high cluster.
    - This week's 6 correctly tagged posts: 3 of 6. That is the first sign the new format can hold the first test group. Low-medium confidence (posts are 0 to 6 days old).
  - **REAL FIX** (n=3): 0.11x, 1.00x and 0.93x (069 at under a day), a median of 0.93x.
    - It earned 2 shares and 4 saves, with a net follow change of −1 and 0 comments.
    - It is the only new series with a share, but n=3 and the posts are young.
  - **MUM ASKS** (n=6): median 0.19x. Five posts sit at 0.11 to 0.24x.
    - 066 is at 1.05x with +1 follow and the best like rate since the reset (15.8 per 1k reach, vs 5.4 on 060).
    - Last week's pause rule (pause if under 0.3x at day 2, after 061's 0.11x) would have stopped our best Mum asks.
  - **SAME PROMPT tag** (n=6, retired): median 0.39x. Closed.
  - **AI RUNS MY SHOP** (n=1 in this data): 068 at 0.16x and 10.9s. It cannot be read.
  - **AFTER HOURS** has never shipped.
  - **The experiment** (Gemini delivers the fix in 2 of 4 real fix posts):
    - Gemini arm: n=1 (065, 0.11x).
    - Claude/Codex arm: n=2 (067 at 1.00x, 069 at 0.93x).
    - It is unread. The second Gemini real fix never shipped.
  - **The reach slide still predates the reset**, so the old format's 70% vs 29% hit rate is not proof that the new format caused it.
  - Confidence: medium that the episode, not the series, decides the cluster. Low on everything per series.

- **Views without follows is now a pattern, not one post. That is a profile and payoff problem, not a hook problem.**
  - **The four reels that travelled.** 060, 066, 067 and 069 each passed 950 reach.
    - Together they had 6,132 views and 4,464 reach. The account has under about 10 followers, so almost all of that reach was non-followers.
    - Their net follows add up to 0 (+1, −1, 0, 0), with 0 comments and 0 keyword comments.
  - **Conversion since Oct 30.** Gross +2 follows from 9,019 views is 0.22 per 1k, about 40x below the benchmark pages' 8 to 9 per 1k.
  - **Keyword comments.** All 14 posts since Oct 30 have 0 comments, including the 3 real fix reels with a keyword prize. Even allowing for a cold account, about 6,000 views on the four travelling reels with 0 keyword comments says the ask is not landing.
    - One lead, not tested: the keyword lives only in the caption, which most viewers never open.
  - **What the method says.** High non-follower reach plus low follows means a profile problem. There is still no record that `/ig-profile` has run, the third audit asking.
  - Confidence: medium that this is a conversion problem (n=4 reels now, up from 1). Low on whether the cause is the profile or the payoff.

- **STOP, DO MORE, and before next audit.**
  - **STOP:** judging a whole series by its median while n is under 10. Each series spans both clusters, and 066 came right after 061. Judge each episode at day 2 instead. Medium-low confidence.
  - **STOP:** treating hook rewrites as the lever for reels that already reach about 1,000. Four of them converted nobody. Fix the profile and the payoff first. Medium confidence.
  - **STOP:** shipping a mix that differs from the plan (2 mum asks, 0 after hours, 3 of 4 real fix). The experiment and the test slot cannot be read otherwise. Also stop off-slot posts like 066 at 22:57: the reason is attribution, not reach.
  - **DO MORE:** REAL FIX at 4 a week. It has the only shares and most of the saves since the reset, and 2 of 3 posts are in the high cluster. Low confidence, n=3, young posts.
  - **DO MORE:** finish the experiment as designed, with one more Gemini real fix, before moving the split. Note that Gemini is 0 of 3 in the high cluster since the reset, though only one of those was a real fix. Low confidence.
  - **DO MORE:** single-rule money-loss topics (the 066 and 069 shape), across both REAL FIX and MUM ASKS. Check the files first, since this lead comes from titles only. Low confidence.
  - **DO MORE:** run `/ig-profile` before tonight's post. Also test, once this week, the keyword word shown on the final laptop screen as well as in the caption. The bible allows at most one test a week.
  - **For `/ig-viral`:** filter the swipe file to number-plus-stakes hooks on money lost and work pain. Drop quiz and "Mum asked me..." formulas.
  - **Before next audit:**
    - Pull hold at 3s, non-follower share and Insights follows.
    - Get retention graphs for 066 vs 061 (best vs worst Mum asks, 15.8s vs 6.6s) and for 067 vs 065 (the two experiment arms).
    - Read the episode files for 061 and 065 to 069, and compare the hook text and first line across the two clusters.
    - Log keyword comments per post.
    - Confirm whether the dataset is complete (Mum asks parts 2 and 4, shop days 1 to 5).

## Week of 2026-11-07

- **The sample is still too small, the data is still incomplete, and the series tags are still wrong. Read every claim below as a lead, not a rule.**
  - **Sample.** 30 posts from Oct 18 to Nov 6. This entry adds 053 and 063 to the 11-06 entry and gives every post another day of age. Of the 8 posts since the one-a-day reset (Oct 30), only 059 and 058 are 7 days old. 063 is under a day old and 053 is 2 days old.
  - **Missing metrics, fourth audit running.** Hold at 3s, non-follower share and Insights follows are missing again (`follows` is null on all 30). The hook still cannot be graded, and a hook problem still cannot be told apart from a distribution problem.
  - **Episode files.** I did not have them in this session. Hook text, first lines and durations were not compared for the third audit running. This is now the main blocker.
  - **Median check.** With 30 posts the true median is 1,473.5: the average of the 15th post (1,491) and the 16th (1,456), not 1,491. Every multiple rises about 1.2%. No ranks change, so the multiples below use the 1,491 as given.
  - **Tags.** The 11-06 strategy said to fix the tags before posting again. 053 and 063 still shipped as `SAME PROMPT, 3 AIS`. Six posts carry the retired tag, and none carries `REAL FIX` or `AI RUNS MY SHOP`.
    - 053 was published after 064, and the titles "Just one typo" and "Diwali wishes" read like the retired low-stakes everyday jokes. Either old queued episodes are shipping, or real fix episodes are mislabelled. Low-medium confidence until the files are read.
    - Until the tags are fixed, the series comparison and this week's "who delivers the fix" experiment cannot be read.
  - Confidence: high that this data cannot support strong patterns.

- **Top 5 and bottom 5 by outlier multiple, top by sends, and follows.**
  - **Top 5:**
    - 011 "Cancel politely": 1.50x, Claude, old format, 21.8s
    - 003: 1.43x, Gemini, old, 16.9s
    - 060 "Boss at eleven": 1.41x, Claude, new, 17.4s, 1,484 reach
    - 019: 1.35x, Gemini, old, 17.8s
    - 014: 1.32x, Codex, old, 14.6s
    - Average watch is 17.7s, and **none of the five has a single share.** Four of the five are old format.
  - **Bottom 5** (six listed, because three posts tie at 0.14x):
    - 022: 0.09x, 7.8s
    - 005: 0.11x, 11.4s
    - 063: 0.12x, 11.8s, under a day old, so not ranked
    - 052, 058 and 017: 0.14x each, at 10.7s, 9.8s and 11.0s
    - Average watch is 10.4s. Three of the six are new format, and two are Mum asks.
  - **Top by sends** (shares = shares per 1k × reach):
    - 004: about 6 shares (7.9 per 1k)
    - 044: about 5 (4.2 per 1k)
    - 009: about 4 (3.6 per 1k)
    - 018: about 2 (1.5 per 1k)
    - 008: 1 (0.9 per 1k)
    - That is 18 shares in total. The last one was on Oct 28 (044), and **there are 0 shares on all 8 posts since the reset.** By turn, the shares split Gemini 10, Claude 7, Codex 1.
  - **Follows.** The only next-day gain since the reset is +1 on 062 "Gift for the boss". One follow cannot rank anything.
  - Confidence: high on the counts. Low on anything drawn from single-digit shares and follows.

- **What separates top from bottom: the first test group, not the middle of the episode, as far as this data can tell.**
  - **Two clusters, not a slope.** 16 posts land at 1,456 to 2,231 views and 13 land at 136 to 684. 004 (1,080) sits between them.
  - **Watch time.** The high cluster averages 16.6s and the low cluster 11.9s (11.0s without 007 and 053).
    - 053 is a second 007: 16.6s watch on only 296 reach. The people who got it stayed, but few got it, which points at distribution.
    - 059 (9.1s) and 058 (9.8s) lost people early, which points at the hook. Without hold at 3s, this is as far as the data goes.
  - **No late recovery after day 2.** 058 and 052 sat at 0.14x on 11-06 and are still at 0.14x. The four Mum asks posts moved from 0.14 to 0.21x to 0.14 to 0.22x in a week. The day-one recoveries (010, 014) happened inside 48 hours. Medium-low confidence (about 5 posts). It means a post that is low on day 2 is a safe planning signal, but keep the 7-day rule for ranking.
  - **Who delivered the turn:**
    - Gemini: 0.99x mean (n=10)
    - Claude: 0.83x (n=9)
    - Codex: 0.53x (n=10), with 6 of 10 under 0.25x
    - Gemini's lead is an old-format lead. Its one turn since the reset, 053, sits at 0.29x at 2 days.
    - Claude carried all three of its Mum asks plus both boss posts, so the turn is tangled with series and topic. Confidence: low.
  - **Theme.** The two best posts since the reset are both about the boss: 060 at 1.41x and 062 at 0.41x, and 062 brought the only follow. Low confidence (n=2, 0 shares between them).
  - **Day and time, checked last, show nothing usable.**
    - 060 and 062 both went out at about 20:32 IST and are the top two since the reset.
    - 053 (20:55) and 052 (21:11) are low, and all four 20:01 posts are low.
    - That is n=2, and it is confounded with the boss theme. Posts are also drifting off the planned 20:00 slot.

- **Series vs series, and new format vs old. What shipped as the new format is losing, but the real fix format has not actually been tested.**
  - **Old "Hey committee"** (n=20): median 1.05x, 14 of 20 at or above 0.95x, 13 shares.
  - **Since the reset** (n=8): median 0.22x, 1 of 8 above 0.5x (060). The 8 posts together have 0 shares, 1 save (058), 0 comments, 0 keyword comments and 1 follow.
  - **`SAME PROMPT` tag** (n=6): 1.41x, 1.21x, 0.41x, 0.29x, 0.22x and 0.12x, a median of 0.35x. All 5 of its shares came from 044, which went out before the reset.
  - **Mum asks** (n=4): 0.22x, 0.20x, 0.14x and 0.14x, a median of 0.17x. All four sit in the low cluster, with 0 shares and a best reach of 267. 4 for 4, and none has moved in a week.
  - **Real fix and AI runs my shop:** n=0 by tag, so there is no result either way.
  - **The slide still predates the reset.**
    - From Oct 21 to the morning of Oct 27, 12 of 13 posts were at or above 0.95x.
    - From the evening of Oct 27 on, 2 of 12 broke 0.5x. The first two lows of that run (021, 022) were old format.
    - So the new format is not proven to be the cause. But 9 days and 8 posts in, nothing shipped under it has earned a share.
  - Confidence: medium that Mum asks as built is our weakest series. Low on why reach fell.

- **Views without follows is still a profile and payoff problem, not a hook problem.**
  - **Reach.** 060 reached 1,484 people. The account has under 10 followers, so that was almost all non-followers.
  - **What 060 earned:** 0 follows, 0 shares, 0 comments, 0 keyword comments and 8 likes (5.4 per 1k reach, against 28 per 1k on 011).
  - **Conversion.** Since the reset there is 1 follow from 4,405 views and 3,271 reach. That is 0.23 per 1k views, against 8 to 9 per 1k for the benchmark pages, about 35x lower.
  - **Keyword comments.** They are 0 across all 3,271 post-reset reach. Either the prize is not worth a comment or the question is not landing.
  - **Profile.** There is no record that `/ig-profile` was run.
  - Confidence: low (n=1 travelling post, and follows here are a next-day net change, not Insights follows). It is still the clearest "views but no follows" case we have.

- **STOP, DO MORE, and before next audit.**
  - **STOP:** publishing any post that is not tagged with its real series. Make it a hard gate: no `REAL FIX` / `MUM ASKS` / `AI RUNS MY SHOP` / `AFTER HOURS` tag means it does not post. Two more retired-tag posts shipped after the last audit said stop, and this week's experiment cannot be read without the tags.
  - **STOP:** low-stakes everyday topics, if the files confirm 053 and 063 are what their titles suggest. They landed at 0.29x and 0.12x and match the retired formula. Low-medium confidence.
  - **STOP:** Mum asks beyond the one rebuilt slot. If the rebuilt one is under 0.3x at day 2, pause the series. Medium confidence.
  - **STOP:** waiting for posts that are low at day 2 to recover (see the 052 and 058 evidence). Keep the 7-day rule for ranking only.
  - **DO MORE:** the boss and work-at-night shape (060 and 062 are the top two since the reset, and 062 brought the only follow). Low confidence, n=2.
  - **DO MORE:** keep Gemini on the fix in 2 of the 4 real fix episodes, as planned. Do not expect it to carry the new format: its one post-reset turn is 0.29x. Low confidence.
  - **DO MORE:** run `/ig-profile` now, and make the keyword prize something people would otherwise search for. 060's reach with 0 conversions says the profile and payoff matter more than another hook rewrite.
  - **Before next audit:**
    - Pull hold at 3s, non-follower share and Insights follows. Above all, get the retention graphs for 060 (our best since the reset) and 059 (9.1s, our weakest watch). These two screenshots would settle hook vs distribution.
    - Read the episode files for 053, 063, 059, 060 and 062, and compare the hook text and first line across the two clusters.
    - Log keyword comments per post.
    - Post at 20:00 IST, not 20:30 to 21:11.

## Week of 2026-11-06

- **The sample is too small and the data is incomplete. Read every claim below as a lead, not a rule.**
  - We have 28 posts from Oct 18 to Nov 4. The 6 posts since the reset are 1 to 6 days old. Under our own 7-day rule, none of them can be ranked yet.
  - I am reading 059, 058, 052 and 060 provisionally, because our past recoveries happened in the first two days. 010 and 014 both went from about 0.1x at under a day to 1.2 to 1.3x. So 062 (2 days) and 064 (under a day) may still move. 059, 058 and 052 probably will not.
  - Hold at 3s, non-follower share and per-post follows are missing for the third audit running, so the hooks still cannot be graded.
  - I did not read the episode files this session. That means hook text, first lines and durations were not compared, and old vs new hooks cannot be compared line by line.
  - The median of these 28 posts recomputes to 1,508, not 1,525. Multiples shift about 1% and no ranks change.
  - **Series tags look wrong.** 059, 060 and 062 are tagged `SAME PROMPT, 3 AIS`, a series retired on 29 Oct. No post carries `REAL FIX`, although the plan called for 4 a week. Either the retired format is still shipping or the tags are stale. Until this is fixed, the series comparison below is partly blind.
  - Confidence: high that this data cannot support strong patterns.

- **Top 5 and bottom 5 by outlier multiple, and top by sends.**
  - **Top 5 by outlier multiple:** 011 "Cancel politely" 1.46x, 003 1.40x, 060 "Boss at eleven" 1.38x, 019 1.32x, 014 1.29x. Four of the five are old format. Average watch is 17.7s.
  - **Bottom 5:** 022 0.09x, 005 0.11x, 017 0.14x, 058 0.14x and 052 0.14x. Two of these are Mum asks. Average watch is 10.1s.
  - **Top by sends:** 004 7.9 per 1k (about 6 shares), 044 4.2 per 1k (about 5), 009 3.6 per 1k (about 4), 018 1.5 per 1k (about 2), 008 0.9 per 1k (1). That is 18 shares across 28 posts, and **0 shares on all 6 posts since the reset.**
  - **The posts fall into two clusters, not a slope.** 16 posts got 1,456 to 2,229 views, 11 got 136 to 683, and 004 sits between. Instagram either gives a reel the full first test group or almost nothing.
  - Watch time separates the two clusters: 16.6s in the high cluster vs 11.5s in the low one (10.9s without the crowded 007). Without hold at 3s, we cannot tell whether viewers left in the first seconds (a hook problem) or the reel was shown to fewer, colder people.
  - **Who delivered the turn:**
    - Codex: 0.56x mean (n=9). 5 of 9 are under 0.25x, including 017 and 022, which went out in normal 11 to 13 hour slots. So the "bad slots" excuse from last week is weaker now.
    - Gemini: 1.05x (n=9) and 10 of the 18 shares. It has delivered **zero** turns since the reset.
    - Claude: 0.81x (n=9). Its low posts are the three Mum asks plus 062.
  - Confidence: medium that the two clusters are real. Low on the turn, which is tangled up with topic and series.

- **Series vs series, and new format vs old.**
  - **Old "Hey committee"** (n=20): median 1.06x, 14 of 20 at or above 0.95x, 13 shares.
  - **`SAME PROMPT` tag** (n=4): 1.38x, 1.18x, 0.40x, 0.21x (median 0.79x). All 5 shares came from 044.
  - **Mum asks** (n=4): 0.21x, 0.19x, 0.14x, 0.14x. All four are in the bottom 7. They have 0 shares, 1 save, average watch of 9.8 to 13.1s, and the best one reached 317 views. Only 046 is mature, but the four are 4 for 4 and tightly grouped. "Send this to your parents" is not producing sends.
  - **Real fix:** no data, because nothing carries the tag.
  - **Hinglish vs English experiment:** it cannot be read. Follows, shares and keyword comments are 0 on every Mum asks post, so both arms tie at zero.
  - What we may not like hearing: so far the new format reaches less than the old one did (median 0.21x vs 1.06x). It has not earned more sends or follows to make up for it.
  - Confidence: medium that Mum asks as currently built is our weakest series. Low on the overall new vs old gap, because of post age and the slide in the next bullet.

- **The reach slide began two days before the reset, so the new format is not proven to be the cause.**
  - From Oct 21 to the morning of Oct 27, 12 of 13 posts landed at or above 0.95x (only 017 failed).
  - From the evening of Oct 27 on, only 2 of 10 broke 0.5x: 044 and 060.
  - The slide started under the old format and the old two-a-day cadence.
  - Moving to one a day has not helped: 1 of 6 posts since the reset is above 0.5x. The strategy's claim that "two a day splits the test group" is not supported, because the 12-hour two-a-day run was our best stretch.
  - Keep one a day anyway, but for a different reason: it is the only way `followers_gained_next_day` belongs to a single reel. It is not a reach lever.
  - Day and time, checked last, show nothing:
    - 060 at 20:32 IST was our best post. 059 at 20:01 and 052 at 21:11 were both low.
    - Both morning posts in this window were low, but n=2.
  - Confidence: medium on when the slide started, low on why.

- **The one reel that travelled converted nobody. That points at the profile and the payoff, not the hook.**
  - 060 reached 1,484 people. The account had 6 followers at the 29 Oct audit, so almost all of that reach was non-followers.
  - It brought 0 net follows, 0 shares, 0 keyword comments and 8 likes.
  - Since the reset we have 1 follow from 3,778 views, about 0.3 per 1k views. The benchmark pages convert 8 to 9 per 1k.
  - The 0 keyword comments on the low-reach posts is expected at about 200 reach. On 060 at 1,484 reach, it suggests the prize or the question is not pulling.
  - Confidence: low (n=1, and the follow number is a next-day net change, not Insights follows). It is still the clearest "views but no follows" case we have, which by the method means a profile problem.

- **STOP, DO MORE, and before the next audit.**
  - **STOP:** Mum asks at 2 a week. Run none next week, or at most one rebuilt version in the test slot with a number-and-stakes hook (the money lost, the call in your voice), not "Mum asked me...". Check whether the four past Mum asks hooks carried a digit. The bible only requires a digit for real fix.
  - **STOP:** the Hinglish experiment as designed. It cannot produce a result while every outcome is zero. Close it as inconclusive.
  - **STOP:** publishing anything tagged `SAME PROMPT`. Fix the tags before posting again.
  - **STOP:** changing the cadence to chase reach. We changed it twice in two weeks, and our numbers support neither change.
  - **DO MORE:** the 060 shape, meaning work pain with a clock or number in the hook (the boss at night). It is our best post since the reset at 1.38x. Low confidence, n=1, and it still earned 0 shares.
  - **DO MORE:** give Gemini the turn in at least 2 of 7 episodes. It has a 1.05x mean, 10 of our 18 shares, and no turns since the reset.
  - **DO MORE:** run `/ig-profile` this week, because of 060.
  - **Before next audit:**
    - Pull hold at 3s, non-follower share and Insights follows for every reel.
    - Log keyword comments per post.
    - Correct the series tags, and confirm whether 059, 060 and 062 were meant to be real fix.
    - Read the episode files to compare hook text, first line and duration across the high and low clusters. That comparison is the only way to tell a hook problem from a distribution problem.

## Week of 2026-10-29 (account audit, by hand)

- **Every reel stops at the first test group.** 22 reels, about 30K views, 6 followers, 2 comments; views 1,500 to 2,200 each, shares about 0.6 per 1,000 reach. Confidence: high.
- **The first new-format reels did not break out.** 044 TRUTH (same prompt, keyword): 1,224 views, 1 like, 0 comments, so a prompt is not a prize worth commenting for. 046 Mum asks part 1: 204 views on day one. Confidence: medium (young posts).
- **Benchmarks (29 Oct):** @canwebuildthis 61K from 4 reels of 1.3 to 1.8M views, newest reel 13K. @ashutoshwithclaude 25.5K from jobs pain plus real free tools plus keyword (764K, 530K, 465K views; 2,500 to 6,800 comments). @ronniehasaprompt (a lookalike) 38 followers. Same-prompt pages 25 to 200 likes. Big pages convert about 0.8 to 0.9 follows per 100 views, so 10K followers needs about 1.1M views. Confidence: high for the pattern.
- **DO:** real problem plus real free fix, number-and-tension hooks, keyword prizes people would search for, 20 to 30 s, one reel a day. **STOP:** same prompt, quiz hooks, low-stakes jokes, two a day.

## Week of 2026-10-24

- **The sample is still too small, the data is still incomplete, and no post is old enough to rank under our own rule.** We have 12 posts from Oct 18 to 24. The oldest (003) is 6 days old, so every number below is provisional. Hold at 3s, non-follower share and follows are missing for the second week running, so we still cannot grade a hook or tell a hook problem from a profile problem. I did not read the episode files this session, so first lines and first shots were not compared. Themes below are guessed from titles.
  - The 7-day rule is earning its keep. 010 "Is this a deal" was 0.14x at under a day old last week and is 1.24x now. 014 "Split the bill" (0.12x, under a day old) is excluded for the same reason.
  - Median check: the 12 listed posts give a median of 1,506 views, not 1,524, probably because of a post outside this list. Multiples shift about 1% and no ranks change.
  - Confidence: high that this data cannot support a pattern yet.

- **Top by outlier multiple:** 011 "Cancel politely" 1.46x (2,224 views, Claude turn), 003 "Ninety-two percent" 1.40x, 010 1.24x, 009 "What's for dinner" 1.08x, 013 "Who copied me" 1.07x.
  - 011 also has the best average watch time of all 12 (21.8s vs 17.6s for the top five) and the most likes (38, about 27 per 1k reach).
  - **Top by sends:** 004 "The meeting" 7.9 per 1k (about 6 shares from 762 reach), 009 3.6 per 1k (about 4 from 1,103), 008 "Tidy my laptop" 0.9 per 1k (1 share). That is about 11 shares across 12 posts.
  - None of the top three by outlier multiple has a single share. The posts that travel and the posts people send are not the same posts.
  - Confidence: low, because the shares are in single digits.

- **Bottom: crowding separates it, not content, as far as this data can tell.** The two mature flops are 005 "Sound casual" (0.11x) and 007 "Be honest" (0.20x). They were posted 4h and 10h after 006 on Oct 20, three posts in 10 hours.
  - Since Oct 21 we have posted two a day at 11 to 13 hour gaps. All six mature posts in that run (008 to 013) landed between 0.95x and 1.46x.
  - Watch time does not explain the flops. 007 held viewers 17.8s, above the top-five average, on 200 reach. Its problem was distribution, not the episode.
  - Time of day, checked last: evening posts (20:01 IST) average 1.25x (n=4) and mornings 0.98x (n=5). That gap is inside the noise. The evening tripwire (under 0.5x) is not triggered.
  - Confidence: medium-low that the cutoff is "closer than about 11 hours", not "more than one a day".

- **Codex vs Gemini delivering the turn: still inconclusive, and the gap has nearly closed.**
  - Gemini averages 1.08x (n=6). Codex's two clean posts average 0.98x (008 at 1.00x, 012 at 0.95x).
  - Codex's three bad numbers are the two crowded Oct 20 slots and the under-a-day 014. The schedule gave Codex every bad slot, so the turn and the slot are confounded.
  - Gemini does lead on sends: about 10 of the 11 shares came from Gemini-turn posts (004, 009).
  - Claude's one turn (011) is first on reach, watch time and likes, but n=1 and it is 2 days old.
  - Confidence: very low on views, low on the Gemini sends lead.

- **"Office pain gets sends" does not hold up. It rested on one post.**
  - Two more work posts since then, 006 "Quick holiday call" and 012 "Explain my job", got 0 shares, 0 saves and about 5 likes per 1k reach, the weakest engagement among the mature posts. 010 is just as flat (6 likes per 1k).
  - The other send post, 009, is about dinner, not work. What 004 and 009 share beyond a Gemini turn needs the episode files to answer.
  - Comments are still zero on all 12 posts. That breaks this week's caption experiment: if comments per 1k reach ties at 0 to 0 every day, it ends with no result.
  - Confidence: low.

- **STOP / DO MORE / before next audit.**
  - **STOP:** posting less than about 11 hours after the previous post. Both mature flops came 4 to 10 hours after one.
  - **STOP:** ranking posts under 7 days old (see 010).
  - **STOP:** adding work episodes on 004's strength alone. Hold work at its planned share of the mix and do not grow it.
  - **DO MORE:** keep the two-a-day 09:00 / 20:00 IST cadence. Six clean posts in a row landed at or above about the median.
  - **DO MORE:** keep Codex at 3 morning and 3 evening slots, and keep it out of the newest-post position when we audit.
  - **DO MORE:** keep both Claude slots, and read 011's episode.json to see what held people for 21.8s.
  - **Before next audit:** pull hold at 3s, non-follower share and follows for every post. The hook vs profile question cannot be answered without them.
  - **Before next audit:** give the caption test a second read (shares plus saves per 1k reach), in case comments stay at zero.
  - **Before next audit:** compare the first line and first shot of the top five against the bottom five from the episode files.

## Week of 2026-10-23

- **The sample is too small to support a pattern, and the data is incomplete.** We have 8 posts in 5 days (Oct 18 to 22). There is no hold at 3s, no non-follower share and no follows, so we cannot grade the hooks or tell a hook problem from a profile problem. The episode files were not in the working directory, so first lines and first shots were not compared either. Post ages also differ a lot: 003 is about 4 days old, 010 is under a day. Treat every bullet below as a lead to check, not a rule. Overall confidence: low.

- **Top by outlier multiple:** 003 "Ninety-two percent" at 1.81x (2,129 views, Gemini turn), then 006 "Quick holiday call" and 008 "Tidy my laptop", both at 1.27x. **Top by sends:** 004 "The meeting" wins easily. It has 7.9 shares per 1k reach, about 6 shares from 760 reach. The other seven posts have about 1 share combined (008). By the metric that counts most, 004 is our best post, even at 0.92x views. It is also the most office-pain story we posted. Confidence: low (n=1, 6 shares). It is still the only real send signal we have.

- **Bottom:** 010 "Is this a deal" (0.14x) is under a day old, so it is excluded and gets re-checked next week. 005 "Sound casual" (0.14x) and 007 "Be honest" (0.25x) were the second and third posts on Oct 20, inside 10 hours. 006 went out first that morning and reached 1.27x. The simplest explanation is that we crowded our own posts, not that those episodes were bad. Confidence: medium-low. Three posts in one day is one data point, but the drop from 1.27x to 0.14x and 0.25x is steep.

- **Watch time does not separate top from bottom, so the middle of the episodes is not the problem.** The top five average 16.1s. 007 has our best watch time (17.9s) on our second-worst reach. The people who saw it stayed; it just was not shown to many. 005 and 010 are lower (11.6s and 10.4s), worth a look once we have retention graphs. We also have zero comments across all 8 posts. Confidence: medium on "the middle is fine", none on why reach differs.

- **Week 1 experiment (Gemini vs Codex delivering the turn): inconclusive.**
  - Gemini averages 1.25x (n=4, excluding the too-new 010).
  - Codex averages 0.55x (n=3), but two of its three posts are the crowded Oct 20 slots.
  - Codex's one clean post, 008, did 1.27x and earned the only share and most of the saves outside 004 (3 saves).
  - Do not drop Codex on this evidence. Confidence: very low.

- **STOP:** publishing more than one episode per day. Space posts at least 12 hours apart so they stop competing with each other (medium-low confidence). **DO MORE:** office-pain stories in the shape of "The meeting", since it is the only episode people sent to someone (low confidence, n=1). **Before next audit:**
  - Pull hold at 3s, non-follower share and follows for every post. Hold at 3s is the one number that would let us judge hooks.
  - Let each post age 7 days before ranking it.
  - Keep using all three members, with the turn split evenly between Gemini and Codex.

## Before launch (research, 16 Oct 2026)

- Best formats elsewhere: AI personality contrast (@canwebuildthis "one asks four questions, one asks none": 12.6x its normal) and the endless redo (18.6x). Everyday office pain is the multiplier (@corporate.bro, @corporatenatalie).
- Weak: sentimental AI stories (0.15x) and AI product announcements.
- Experiment for week 1: every episode uses all three members; compare episodes where Gemini (oversharing) vs Codex (literal) delivers the turn.
