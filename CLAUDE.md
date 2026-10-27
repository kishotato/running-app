# Running Training App

A personal running training app for my Android phone.

## Tech
- React + Vite, built as an installable, offline-capable PWA.

## Hosting
- GitHub Pages, deployed automatically with GitHub Actions.

## Data
- My plan is in `lakeland-plan-weeks-1-5.json` (bundled with the app). I will keep updating this file until the full training plan is mapped out.
- My logs (completed, actual distance/pace, RPE, notes) are stored on the phone in `localStorage`, keyed by run id.
- No backend, no accounts.

## Navigation
Floating bottom nav bar with exactly four items: **This Week · Plan · Progress · Profile**.

### 1. This Week
- Big card with today's run.
- Upcoming runs for the week.
- How far I've completed this current week (e.g. km done vs planned).

### 2. Plan
- Contains the whole plan.
- Toggle at the top: **Plan** / **Calendar**.
- **Plan mode** (default):
  - Shows the **weekly** view by default; a toggle switches between **Week** and **Month**.
  - In both, swipe left/right to move to the previous/next week or month.
- **Calendar mode**:
  - A basic, standard calendar view for now.
  - Later: colour coding and possibly a few different calendar views (not yet).

### 3. Progress
- All stats, with some graphs (e.g. weekly km, completion, race countdown).
- How progress is filtered will be decided later. Keep it simple for now.

### 4. Profile
- My current LTHR.
- Heart-rate zones calculated from LTHR.
- Paces for each effort/zone.
- More fields may be added later.

### Run detail (not a nav item)
- Opens when you tap any run.
- Shows all fields from the plan + a log form.

## Extras
- Mark a run as done.
- Log how it felt.
- Export/import my logs as a JSON backup.
- Import a new plan file.

## Design
- Mobile-first, dark mode, large tap targets, clean and sporty.

## Commands
- `npm install` – install dependencies (once).
- `npm run dev` – local dev server (`npm run dev -- --host` to open it from the phone on the same Wi-Fi).
- `npm run build` – production build into `dist/`.
- `npm run icons` – regenerate the PNG app icons from `scripts/make-icons.js`.

## Code map
- `src/store.jsx` – shared state (plan, logs, profile) + localStorage persistence, export/import.
- `src/lib/` – plain helpers: `plan.js` (indexes the plan, session ids = `YYYY-MM-DD-AM|PM`), `dates.js`, `pace.js`, `zones.js`, `stats.js`, `storage.js`.
- `src/screens/` – `ThisWeek`, `Plan` (week/month + calendar), `Progress`, `Profile`, `SessionDetail` (run detail + log form).
- `src/components/` – `BottomNav`, `SessionRow`, `DayBlock`, `ui.jsx` (Segmented, Swipeable, ProgressBar, DoneButton), `Icon`.
- Routing is hash-based (`#/plan`, `#/week/s/<sessionId>`) so GitHub Pages never 404s and the phone back button closes the detail view.
- Styling: single `src/styles.css`; colours are CSS variables at the top (`--accent`, `--z1`…`--z5`).
- Deploy: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push to `main`. `vite.config.js` uses `base: './'` so any repo name works.

## Working with me
- I'm learning: explain what you do in plain English as you go.
