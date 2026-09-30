# Rexville Live Warehouse Dashboard

A Rexville Solutions-branded copy of the Fiege warehouse TV board (amber/navy theme, Rexville logo). It shares the same live Firebase data as the Fiege board: a public leaderboard display plus an admin panel to manage the data behind it, backed by a live Firebase Firestore database (writes broadcast to the TV board in real time, with no page reload and no polling).

**Live:** https://rexville-solutions-2026.github.io/dashboard/#/top5 (deploys automatically from `main` via GitHub Actions)

## What's included

- **`/#/top5`** — the public TV board. This is a single full-bleed screen (no scrolling — every size is fluid `vh`/`clamp()`, matching the original's fixed-viewport layout) that auto-rotates every 30s through **four** views, matching the original site's exactly:
  1. **Top 5** — Top 5 Pickers / Top 5 Packers, trophy icon, red/cyan, editable banner message.
  2. **Bottom 5 / "Focus 5"** — same layout in orange, trend-down icon, fixed encouragement banner.
  3. **Performance Board** — 6 stat tiles (Pick/Pack UPMH and units packed, both "last hour" and "cumulative"), computed live from the hourly data entered in Admin. Pick/Pack UPMH tiles turn green when they hit the shift target and red when they fall short, with a pulsing "live" dot on the current hour.
  4. **Operations Board** — Units to Pick, Units to Pack, Pre Processed Failed, Backlog Orders, Overpicks — filled in via Admin step 2.

  The visual system (colors, fonts, the hexagon logo mark, panel borders, the sheen/glow/entrance animations, and the 30s rotation progress bar under the footer) was rebuilt to match the original site's own CSS and component output pixel-for-pixel rather than approximated from screenshots.
- **`/#/admin`** — password-gated 4-step wizard:
  1. **Outbound SIC Data** — import a CSV/XLSX to auto-fill the 24-hour Pick/Pack grid, with live UPMH (units per man-hour) calculation and validation.
  2. **Units to Pick/Pack** — manual counters for the Operations board (units to pick/pack, pre-processed failed, backlog orders, overpicks).
  3. **Top 5 Board** — names + units for top pickers/packers, plus the banner message.
  4. **Bottom 5 Board** — same for the bottom 5.
  - **Save & Broadcast** pushes everything live to the TV boards instantly (Firestore realtime listeners). **Reset for New Day** clears the current report date.

Routes use `#/...` (hash routing) rather than plain paths — that's what lets a direct link like `/#/admin` work correctly on GitHub Pages, which can't do server-side rewrites the way Netlify/Vercel can.

## Getting started

```bash
npm install
npm run dev
```

This ships pre-configured (via `.env` for local dev, `.env.production` for the deployed build) to write into a Firebase project already set up for you, with Firestore already enabled — it should work immediately.

- TV board: `http://localhost:5173/#/top5`
- Admin: `http://localhost:5173/#/admin` (password is set via `VITE_ADMIN_PASSWORD`, see below)

## Configuration

Copy `.env.example` to `.env` if you ever want to point this at a different Firebase project:
