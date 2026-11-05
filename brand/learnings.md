# What the numbers said

Newest week on top. The weekly planner adds an entry every time it plans, from `content/analytics/log.csv`.

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
