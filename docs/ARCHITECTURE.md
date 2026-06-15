# My Journey Architecture

My Journey is a personal-use health operating system built with Next.js 15, React, TypeScript, Tailwind CSS, Supabase, Recharts, Framer Motion, React Query, Zustand, and PWA metadata.

## Folder Structure

- `src/app`: App Router pages and API routes.
- `src/components`: Product UI components.
- `src/lib`: Parsing, data access, Supabase, and shared utilities.
- `src/store`: Zustand client state.
- `src/types`: Shared TypeScript contracts.
- `supabase/schema.sql`: PostgreSQL tables, RLS, and seed data.
- `docs`: Setup, deployment, and architecture notes.

## Data Flow

1. The UI reads user state through Supabase clients and caches server data with React Query.
2. Personal profile, daily logs, challenge progress, and Garmin manual inputs are local-first today and persisted in browser storage.
3. Quick client interactions, theme, and current navigation use Zustand.
4. Verified foods are fetched through API routes, cached locally in Supabase, and prioritized over AI estimates.
5. AI nutrition estimates and workout imports are treated as drafts until the user reviews and saves them.
6. Analytics read normalized logs from Supabase and render with Recharts.
7. Garmin daily metrics can arrive from a future API sync or from profile/manual entry; both paths feed the same transparent recovery scoring model.
8. The 30-day AI fitness challenge imports a static JSON program, stores user logs locally first, and can export progress as JSON or CSV.

## Personal Profile

The profile section stores age, sex, height, weight, waist, body fat, goal, activity level, protein preference, water, steps, sleep, and Garmin values. It calculates BMR, TDEE, calorie target, protein, carbs, fat, BMI, water target, step target, sleep target, and recovery score inputs. This is local-first under `my-journey-app-data`.

## API Routes

- `POST /api/workouts/import`: Parses pasted workout plans into days and exercises.
- `GET /api/food/search?q=`: Returns verified food search results. The current implementation includes a safe fallback and is ready for USDA/Open Food Facts proxying.
- `POST /api/ai/food-estimate`: Produces unverified meal estimates. Claude can be connected later with `CLAUDE_API_KEY`.
- `POST /api/recovery/score`: Calculates a daily recovery score from Garmin-style metrics and transparent weights.
- `GET /auth/callback`: Exchanges Supabase auth codes for sessions.

## Garmin And Recovery

My Journey includes a future-ready Garmin module for importing resting heart rate, HRV, sleep, stress, Body Battery, training readiness, training status, recovery time, VO2 max, steps, calories, workouts, and intensity minutes. If Garmin API access is not available, the Recovery Dashboard supports manual entry using the same data model.

The recovery score is an estimated personal readiness score from 0-100. It does not copy any wearable brand language and does not claim medical accuracy.

Default scoring weights:

- HRV vs baseline: 30%
- Resting heart rate vs baseline: 20%
- Sleep score and duration: 25%
- Stress score: 10%
- Body Battery: 10%
- Training load and recovery time: 5%

Score labels:

- 0-39: Low Recovery
- 40-69: Moderate Recovery
- 70-100: High Recovery

The formula lives in `src/lib/recovery-score.ts`. Weights are returned by the API and stored with each recovery score so they can later be adjusted in settings without losing historical context.

## AI Fitness Challenge

The “I Let AI Control My Fitness For 30 Days” module lives in `src/components/challenge-program.tsx` and imports its full plan from `src/data/ai-fitness-program.json`.

It includes:

- Day selector for Days 1-30.
- Daily workout type, exercises, sets, reps, rest, cardio, nutrition targets, and TikTok content prompt.
- Daily scorecard using the required 100-point formula.
- Daily tracking fields for weight, waist, sleep, energy, mood, workout completion, steps, calories, protein, water, and notes.
- Checkpoint screens on Days 7, 14, 21, and 30.
- Adaptation modes for missed workout, travel/hotel gym, no gym, and sick/recovery.
- Local browser persistence under `my-journey-ai-fitness-challenge`.
- JSON and CSV exports.

Supabase-ready tables are included in `supabase/schema.sql`: `challenge_programs`, `challenge_days`, `daily_logs`, and `checkpoint_logs`.

## Authentication Flow

1. User opens `/login`.
2. Email magic link or Google OAuth starts through Supabase.
3. Supabase redirects back to `/auth/callback`.
4. The callback exchanges the code and stores the session cookie.
5. App pages can be protected with middleware once private data reads are wired in.

## State Management

- Zustand: theme and lightweight UI state.
- React Query: future Supabase query caching, optimistic updates, and invalidation.
- Supabase: source of truth for profile, logs, foods, photos, habits, sleep, goals, and journal entries.
- Recovery scoring: pure TypeScript model shared by UI and API routes.

## Future Expansion

- Protected route middleware and account onboarding.
- USDA FoodData Central and Open Food Facts live search with Supabase caching.
- Barcode scanner via camera APIs.
- Progress photo storage bucket with comparison view.
- Claude-powered nutrition parsing and photo estimation behind an optional key.
- Apple Health import/export.
- Garmin OAuth/sync worker once API access is available.
- Offline queue for PWA logging.
