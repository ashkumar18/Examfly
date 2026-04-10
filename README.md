# SSC PrepZone

A high-end, dark-mode practice portal for SSC (Staff Selection Commission) exam preparation. Built as a fully offline-capable single-page application with 6,600+ curated questions across 5 subjects.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 |
| Client Database | Dexie (IndexedDB) |
| Routing | React Router DOM 7 |
| Icons | Lucide React |
| Auth & Data | localStorage + IndexedDB (zero backend) |

## Question Bank

| Subject | Full Name | Questions | Subtopics |
|---------|-----------|-----------|-----------|
| Maths | Quantitative Aptitude | 1,500 | 15 (Profit & Loss, SI/CI, Algebra, Geometry, Trigonometry, etc.) |
| English | English Comprehension | 1,300 | 13 (Reading Comprehension, Cloze Test, Error Spotting, etc.) |
| GK | General Awareness | 1,300 | 12 (History, Geography, Polity, Economy, Science, etc.) |
| Reasoning | General Intelligence | 1,500 | 15 (Analogy, Coding-Decoding, Blood Relations, Puzzles, etc.) |
| Computer | Computer Knowledge | 1,000 | 10 (Fundamentals, OS, MS Office, Networking, Security, etc.) |
| **Total** | | **6,600** | **65** |

All questions are seeded into IndexedDB on first load for fast, offline-ready access.

## Features

### Authentication & Roles
- Local user registration with username availability checking and suggestions
- Password strength meter (weak / medium / strong) with real-time feedback
- Change password from profile dropdown
- Two roles: **User** (full exam access) and **Admin/Master** (monitoring-only)
- Session persistence via localStorage

### Dashboard
- Welcome banner with overall preparation progress percentage
- 4-stat cards: Correctly Solved, Current Streak, Average Accuracy, Tests Completed
- GitHub/LeetCode-style contribution heatmap (6 months, 5 intensity levels)
- Recent sessions table with color-coded accuracy (responsive mobile cards + desktop table)
- Quick Start subject tiles with per-subject question counts and weak question indicators
- One-click **Full Exam** mode (20 questions x 5 subjects = 100 questions, 60 min)
- **Improvement Quiz** — auto-targets your weakest questions across all subjects

### Test Configuration
- Subject selection with expandable subtopic trees
- Per-subtopic question counts loaded from IndexedDB
- Configurable question count and time limit
- Subject preselection from dashboard Quick Start tiles

### Focus Arena (Test Interface)
- Single-question display with 4 numbered options
- Question number grid with color-coded states (answered / marked / current / unanswered)
- Countdown timer with visual warning states (normal → warning → critical)
- Mark for review toggle
- Keyboard shortcuts: 1–4 for options, arrow keys for navigation, M for mark
- Question Paper view — see all questions at once with inline answering
- Auto-submit on timer expiry
- Mobile-optimized layout

### Post-Mortem (Results)
- Large score header with percentage
- 4-stat grid: correct / wrong / unattempted / accuracy
- Per-subject breakdown with color-coded progress bars
- SSC-style scoring with negative marking (-1/3 per wrong answer)

### Full Review
- Scrollable list of all questions with your answer highlighted
- Color-coded options: green = correct, red = your wrong pick
- Explanation boxes in recessed containers
- Summary strip with correct/wrong/skipped counts

### Analytics
- **Spider/Radar chart** — subject-wise accuracy visualization
- **Question Mastery distribution** — Mastered / Learning / Weak / Encountered counts, clickable to drill-down
- **Accuracy trend** — smooth line graph over last 20 tests
- **Subject breakdown** — per-subject progress bars with percentages
- **Subject mastery breakdown** — mastered/learning/weak per subject
- **Areas to improve** — subjects sorted by lowest accuracy
- **Most missed questions** — your hardest questions with right/wrong counts
- **Exam history** — full scrollable history with expandable detail modals
- Detail modal: score hero, stats grid, subject breakdown, and full question-by-question review

### Mastery Questions Page
- Filter by category: Mastered (5 correct in a row), Learning (≥50%, 2+ tries), Weak (<50%)
- View all encountered questions with attempt history
- Expandable question cards with explanations

### Admin Panel
- Overview stats: total users, active today, total tests
- User list with avatar, test count, streak, and correct count
- Click any user to see detailed stats: solved, attempted, tests, streak, accuracy, estimated time
- Per-user recent session history

### Design System
- **Theme:** "The Academic Nocturne" — editorial dark mode
- **Font:** Geist (300–800 weight)
- **Colors:** Indigo primary, green success, rose error, amber warning, purple reasoning
- **Layout:** Tonal background layering instead of borders, sharp square corners, neo-brutalist box shadows
- **Mobile-first** responsive design throughout

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Install & Run

```bash
cd ssc-prepzone
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

### Quick Start Script (Windows)

```bash
restart.bat
```

Kills existing Vite processes, installs dependencies if needed, and starts the dev server.

### Build for Production

```bash
npm run build
npm run preview
```

Output goes to `dist/`.

## Project Structure

```
ssc-prepzone/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── QuestionCard.jsx
│   │   ├── ResultCard.jsx
│   │   ├── ReviewCard.jsx
│   │   ├── StreakHeatmap.jsx
│   │   ├── SubjectTile.jsx
│   │   ├── SubtopicTile.jsx
│   │   └── Timer.jsx
│   ├── data/
│   │   ├── maths.json       (1,500 questions)
│   │   ├── english.json     (1,300 questions)
│   │   ├── gk.json          (1,300 questions)
│   │   ├── reasoning.json   (1,500 questions)
│   │   └── computer.json    (1,000 questions)
│   ├── db/
│   │   ├── db.js            (Dexie IndexedDB schema)
│   │   └── seedData.js      (seed + query helpers)
│   ├── lib/
│   │   ├── auth.js          (local auth, sessions, roles)
│   │   ├── streak.js        (stats, streaks, mastery tracking)
│   │   └── utils.js         (scoring, formatting, helpers)
│   ├── pages/
│   │   ├── AdminPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MasteryQuestionsPage.jsx
│   │   ├── QuestionPaperPage.jsx
│   │   ├── ResultPage.jsx
│   │   ├── ReviewPage.jsx
│   │   ├── SubtopicsPage.jsx
│   │   └── TestPage.jsx
│   ├── store/
│   │   └── useTestStore.js  (Zustand test state)
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
├── restart.bat
└── Design.md
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Dashboard / Admin Panel | All (role-based) |
| `/configure` | Test Configuration | User |
| `/test` | Focus Arena | User |
| `/result` | Post-Mortem Results | User |
| `/review` | Full Question Review | User |
| `/analytics` | Performance Analytics | All |
| `/admin` | Admin Panel | Admin |
| `/mastery` | Mastery Questions Drill-down | User |
| `/question-paper` | Full Question Paper View | User |

## Default Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Master (monitoring only) |

Regular users self-register from the login screen.

---

## Roadmap: Free Online Hosting

This is a **fully static** app (no server, no API, no database server). All data lives in the browser via IndexedDB and localStorage. This makes it ideal for free static hosting.

### Option 1: Vercel (Recommended)

Best for: zero-config deployment with instant previews.

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"** → import your repo
4. Set the **Root Directory** to `ssc-prepzone`
5. Vercel auto-detects Vite — build settings are automatic:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click **Deploy**

Free tier includes: unlimited deploys, custom domains, automatic HTTPS, preview deployments on every push.

### Option 2: Netlify

Best for: form handling and easy rollbacks.

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo
4. Set **Base directory** to `ssc-prepzone`
5. Build command: `npm run build`
6. Publish directory: `ssc-prepzone/dist`
7. Click **Deploy site**

Add a `_redirects` file inside `public/` for SPA routing:

```
/*    /index.html   200
```

Free tier includes: 100 GB bandwidth/month, custom domains, automatic HTTPS.

### Option 3: GitHub Pages

Best for: keeping everything in one place on GitHub.

1. Install the `gh-pages` package:
   ```bash
   npm install -D gh-pages
   ```
2. Add to `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react(), tailwindcss()],
   })
   ```
3. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
4. Run `npm run deploy`

For SPA routing, add a `404.html` that redirects to `index.html` in the `public/` folder.

Free tier: unlimited for public repos, automatic HTTPS on `*.github.io`.

### Option 4: Cloudflare Pages

Best for: global CDN performance and generous free tier.

1. Push to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages** → **Create a project**
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `ssc-prepzone`
5. Deploy

Free tier includes: unlimited bandwidth, unlimited requests, 500 builds/month, custom domains.

### Option 5: Firebase Hosting

Best for: if you plan to add Firebase Auth or Firestore later.

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```
2. Set public directory to `dist`
3. Configure as SPA (rewrite all URLs to `/index.html`)
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

Free tier (Spark): 10 GB storage, 360 MB/day transfer, custom domain + SSL.

### Quick Comparison

| Platform | Bandwidth | Builds | Custom Domain | SPA Routing | Setup Effort |
|----------|-----------|--------|---------------|-------------|-------------|
| **Vercel** | 100 GB/mo | Unlimited | Yes + auto HTTPS | Automatic | Minimal |
| **Netlify** | 100 GB/mo | 300 min/mo | Yes + auto HTTPS | `_redirects` file | Minimal |
| **GitHub Pages** | 100 GB/mo | Manual | Yes (CNAME) | Needs `404.html` hack | Moderate |
| **Cloudflare Pages** | Unlimited | 500/mo | Yes + auto HTTPS | Automatic | Minimal |
| **Firebase** | 360 MB/day | Manual | Yes + auto HTTPS | `firebase.json` config | Moderate |

### Recommended Path

1. **Start with Vercel or Cloudflare Pages** — both are zero-config for Vite + React, have generous free tiers, and handle SPA routing automatically.
2. Push to GitHub → connect to hosting platform → done. The entire deployment takes under 5 minutes.
3. Every `git push` automatically redeploys — no manual build step needed.

### Important Notes

- All user data (accounts, scores, streaks) is stored in the **browser's localStorage and IndexedDB**. This means each user's data is local to their browser and device — not shared across devices or users on different machines.
- If you need shared/persistent data across users, you would need to add a backend (e.g., Supabase, Firebase, or a simple Express API).
- The 6,600 questions are bundled in the JavaScript build (~2-3 MB gzipped). This loads once and is cached by the browser.
