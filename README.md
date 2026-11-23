# Sarthi CGL 2027

Mobile app for SSC CGL 2027, built for the **ASO Ministry of External Affairs** target. It simulates **Test-1 (Tier-I)** and **Test-2 (Tier-II) Paper-I** on the CGL 2026 pattern, with live current affairs and exam updates.

## What is inside
- **Mocks**: Test-1 (100 Q, 60 min, four 15-min locked sections, +2/−0.5) and Test-2 Paper-I (Maths 30, Reasoning 30, English 45, GA 25, Computer 20 qualifying; +3/−1; sectional timers). Palette, mark for review, auto-submit, resume after closing, review with explanations, merit and sectional-floor check.
- **Practice**: sectional drills, topic drills, wrong-answer notebook, daily 10 quiz.
- **Questions**: 25+ computer-generated Maths/Reasoning types (always correct, never run out) plus ~145 hand-written English, GA (incl. IR/MEA) and Computer questions. Optional AI maker (free Gemini key) for more.
- **Live**: SSC notices, India, World & MEA, Economy, Sci-Tech, Awards feeds; offline copy; AI quiz from headlines.
- **ASO MEA track**, 34-week plan to your Test-1 date, formula sheet, diplomacy and vocabulary flashcards, analytics, backup.

## Install on your phone (pick one)
**A. Easiest: host free, install from the browser (about 5 minutes)**
1. Create a GitHub repository, upload this whole folder (keep `.github`), and push to `main`.
2. Repo Settings → Pages → Source: **GitHub Actions**. After the first run, your link is `https://<you>.github.io/<repo>/`.
3. Open the link on your phone. Android Chrome: menu → **Install app**. iPhone Safari: Share → **Add to Home Screen**.
4. Actions → **Refresh live current affairs** → Run once. After that it refreshes every 3 hours and the site redeploys.

Alternative hosts: drag the folder to https://app.netlify.com/drop, or run `npx serve .` on your computer for testing (installing needs HTTPS, localhost counts on the same device only).

**B. Android APK**: in GitHub → Actions → **Build Android APK** → Run, then download the `sarthi-cgl-2027-apk` artifact and install it. Or locally with Node, Java 17 and Android Studio: `npm install && npm run android`.

## Keeping it current
- `data/exam-config.json`: exam pattern, dates, sources. Edit when SSC releases the CGL 2027 notice.
- `data/ca-snapshot.json`: verified exam-update cards shown in the Live tab.
- `tools/build_bank.py`: add hand-written questions, run `python3 tools/build_bank.py`.
- Settings → dates: set the real Test-1 / Test-2 dates once announced.

## Honest limits
- CGL 2027 is not announced; the pattern is the CGL 2026 notice as reported by third-party sites. Verify on ssc.gov.in.
- Live feeds could not be tested from the build environment (no internet there). They use Google News/The Hindu RSS through public CORS proxies, with a server-side refresh as the reliable path. If a feed is blocked, the app falls back to its saved copy.
- Hindi medium, Data Entry Speed Test and Paper-II/III are not simulated.
- The hand-written bank is a starter set; use the AI maker and keep adding questions.
