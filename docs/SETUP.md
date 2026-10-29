# Setup (about 20 minutes, once)

The repository, the website and the cloud jobs are already set up. You only connect the three accounts. You type every password and token yourself; nobody else sees them.

## 1. The Instagram account
1. Create **@theaicommittee** in the Instagram app (Add account → Create new account).
2. Profile → ☰ → Settings → **Account type and tools → Switch to professional account → Creator**, category "Entertainment" or "Comedy".
3. Settings → **Messages and story replies → Message controls → Connected tools → Allow access to messages** (so the agent can read and answer DMs).
4. Profile picture and bio: use `docs/profile.jpg` and the bio in `docs/PROFILE.md`.

## 2. Connect it to your Meta app (the same app as @theecomprashant)
1. developers.facebook.com → My Apps → your app → **Instagram → API setup with Instagram business login**.
2. Under **Generate access tokens**, press **Add account** and log in as **@theaicommittee** (in Meta's own window).
3. Press **Generate token** next to it. Copy the **token** and the **Instagram user ID** shown next to the account.

## 3. Add the secrets to GitHub
github.com/dhakadpd10/theaicommittee → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|---|---|
| `IG_ACCESS_TOKEN` | the token from step 2 |
| `IG_USER_ID` | the user ID from step 2 |
| `CLAUDE_CODE_OAUTH_TOKEN` | run `claude setup-token` in a terminal, sign in, copy the token it prints |
| `GH_PAT` | github.com → Settings → Developer settings → Fine-grained tokens → for **this repository only**, permission **Secrets: Read and write**. Keeps the Instagram token alive (it lasts 60 days). |

## 4. Go live
1. **Actions → Check → Run workflow.** Every line should say OK.
2. The 3 finished episodes are already scheduled: Sat 17 Oct 20:00, Sun 18 Oct 09:00 and 20:00 IST.
3. Every **Saturday** morning the **Plan** job makes next week (2 reels a day, Sunday to Saturday; about 2 to 3 hours in the cloud). You get a pull request **"Approve episodes from …"**: watch the videos in it on the GitHub app and press **Merge**. Close it to reject, or set one post's `"status"` to `"skip"` to hold it back.
4. From then on it repeats by itself every Saturday.
5. Comments get answered in character every 15 minutes. Collabs, sponsors, complaints and anything unsure arrive as GitHub **issues** labelled `inbox`; turn on GitHub notifications on your phone.

## Check on it
Actions tab: every run's log says what it did. `content/analytics/log.csv` has every post's numbers (updated daily at 10:00 IST); `brand/learnings.md` is what the agent concluded from them.

## Optional: also post every reel to Facebook and YouTube
The agent copies each reel there within a few minutes of Instagram, and replaces the "Comment WORD" line with a direct link to the free pack (comments there don't trigger DMs). Each one switches on as soon as its secrets exist; nothing changes until then.
- **Facebook Reels:** a Facebook Page linked to @theaicommittee. Secrets `FB_PAGE_ID` and `FB_PAGE_TOKEN` (a long-lived Page token with pages_manage_posts, pages_read_engagement, pages_show_list).
- **YouTube Shorts:** a YouTube channel plus a Google Cloud OAuth app with the YouTube Data API on. Secrets `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (scope youtube.upload). Note: Google keeps uploads from a new, unaudited app **private** until the app passes Google's API audit, so apply for it when you set this up.
- Run the **Check** workflow afterwards: it shows "Facebook Reels: yes" / "YouTube Shorts: yes".
