# My Journey Setup

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
USDA_API_KEY=optional_usda_fooddata_central_key
CLAUDE_API_KEY=optional_claude_key
GARMIN_CLIENT_ID=optional_future_garmin_client_id
GARMIN_CLIENT_SECRET=optional_future_garmin_client_secret
```

The app runs without `USDA_API_KEY`, `CLAUDE_API_KEY`, or Garmin API credentials. AI estimates and recovery scores must stay labeled as estimates.

## Supabase Setup

1. Create a Supabase project on the free tier.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication, enable Email provider.
5. For Google login, enable Google provider and add the OAuth credentials.
6. Add `http://localhost:3000/auth/callback` and your Vercel callback URL to Supabase redirect URLs.
7. Create a storage bucket named `progress-photos` when photo upload is implemented.

## Garmin Setup

Garmin API access can vary by program and approval status, so My Journey is designed to work in two modes:

- Manual mode: enter Garmin metrics directly in the Recovery Dashboard.
- Sync mode: connect a future Garmin OAuth/API client and store imported data in `garmin_connections`, `garmin_daily_metrics`, and `garmin_workouts`.

Run the latest `supabase/schema.sql` to add:

- `garmin_connections`
- `garmin_daily_metrics`
- `garmin_workouts`
- `recovery_scores`
- `recovery_score_factors`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.local`.
4. Deploy on the free tier.
5. Add `https://your-domain.vercel.app/auth/callback` to Supabase redirect URLs.

## Production Notes

- Keep RLS enabled for all user-owned tables.
- Never expose service-role keys to the browser.
- Prefer verified database matches over AI estimates.
- Cache food search results in `food_items` with source metadata.
- Treat imported workouts as drafts until the user saves them.
- Treat recovery as an estimated personal readiness signal, not medical guidance.
- Profile data and challenge logs are currently local-first. Browser storage can be cleared by the user, so export JSON/CSV for backups until Supabase CRUD is wired in.
