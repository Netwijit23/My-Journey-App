# My Journey

My Journey is a personal fitness, nutrition, health, and performance operating system built for single-user use on free-tier infrastructure.

## Stack

- Next.js 15, React, TypeScript, Tailwind CSS
- Supabase Auth and PostgreSQL
- Recharts, Framer Motion, React Query, Zustand
- PWA manifest and mobile-first responsive UI

## Implemented

- Premium dashboard-first interface with light and dark mode
- Today overview, progress summary, quick actions, habits, recovery, and analytics
- Workout plans, exercise database preview, and AI workout text importer
- Nutrition tracker with food estimate flow, confidence labels, and verified-source structure
- Garmin-ready recovery dashboard with manual entry, transparent scoring weights, and trend charts
- Supabase auth login page and callback route
- API routes for workout import, food search, optional AI food estimates, and recovery scoring
- Complete Supabase SQL schema with RLS policies
- Deployment and setup docs in `docs/`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
USDA_API_KEY=
CLAUDE_API_KEY=
GARMIN_CLIENT_ID=
GARMIN_CLIENT_SECRET=
```

`USDA_API_KEY`, `CLAUDE_API_KEY`, and Garmin credentials are optional. The app works without them.

## Database

Run `supabase/schema.sql` in the Supabase SQL editor. See `docs/SETUP.md` for Supabase and Vercel steps.
