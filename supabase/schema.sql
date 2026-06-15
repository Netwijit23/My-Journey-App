create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  units text not null default 'imperial',
  calorie_goal integer not null default 2350,
  protein_goal integer not null default 175,
  water_goal_l numeric(5,2) not null default 3.2,
  steps_goal integer not null default 10000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  equipment text,
  category text,
  instructions text,
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'custom',
  notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  name text not null,
  focus text,
  day_order integer not null default 0,
  exercises jsonb not null default '[]'::jsonb
);

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.workout_plans(id) on delete set null,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  performed_at timestamptz not null default now(),
  duration_minutes integer,
  completed_sets jsonb not null default '[]'::jsonb,
  notes text,
  total_volume numeric(10,2)
);

create table public.food_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  priority integer not null default 100
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_id uuid references public.food_sources(id),
  external_id text,
  name text not null,
  brand text,
  serving_size text,
  calories numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  fiber numeric(8,2) not null default 0,
  sugar numeric(8,2) not null default 0,
  sodium numeric(8,2) not null default 0,
  potassium numeric(8,2) not null default 0,
  cholesterol numeric(8,2) not null default 0,
  is_custom boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  logged_at timestamptz not null default now(),
  meal_type text not null default 'meal',
  quantity numeric(8,2) not null default 1,
  serving_label text,
  nutrition_snapshot jsonb not null
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  servings numeric(8,2) not null default 1,
  instructions text,
  created_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  quantity numeric(8,2) not null,
  serving_label text
);

create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.barcode_products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  food_item_id uuid references public.food_items(id) on delete cascade,
  source text not null default 'Open Food Facts',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_food_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  estimate jsonb not null,
  confidence numeric(4,3) not null,
  model text,
  created_at timestamptz not null default now()
);

create table public.user_food_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_estimate_id uuid references public.ai_food_estimates(id) on delete cascade,
  corrected_food_log_id uuid references public.food_logs(id) on delete set null,
  correction jsonb not null,
  created_at timestamptz not null default now()
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at date not null default current_date,
  weight numeric(8,2),
  waist numeric(8,2),
  chest numeric(8,2),
  arms numeric(8,2),
  legs numeric(8,2),
  neck numeric(8,2),
  body_fat_percentage numeric(5,2),
  notes text
);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_date date not null default current_date,
  angle text not null check (angle in ('front', 'side', 'back')),
  storage_path text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target numeric(8,2),
  unit text,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  value numeric(8,2) not null default 1,
  completed boolean not null default true,
  unique (habit_id, log_date)
);

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sleep_date date not null default current_date,
  hours numeric(4,2) not null,
  quality integer check (quality between 1 and 10),
  bed_time time,
  wake_time time,
  notes text
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  start_value numeric(10,2),
  target_value numeric(10,2),
  start_date date not null default current_date,
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  mood integer check (mood between 1 and 10),
  energy integer check (energy between 1 and 10),
  stress integer check (stress between 1 and 10),
  recovery integer check (recovery between 1 and 10),
  notes text
);

create table public.garmin_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'garmin',
  external_user_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  sync_status text not null default 'manual',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.garmin_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.garmin_connections(id) on delete set null,
  metric_date date not null,
  resting_heart_rate numeric(6,2),
  hrv numeric(6,2),
  hrv_status text,
  hrv_baseline numeric(6,2),
  resting_heart_rate_baseline numeric(6,2),
  sleep_duration_hours numeric(4,2),
  sleep_score integer check (sleep_score between 0 and 100),
  sleep_stages jsonb not null default '{}'::jsonb,
  stress_score integer check (stress_score between 0 and 100),
  body_battery integer check (body_battery between 0 and 100),
  training_readiness integer check (training_readiness between 0 and 100),
  training_status text,
  recovery_time_hours numeric(6,2),
  vo2_max numeric(6,2),
  steps integer,
  calories_burned integer,
  intensity_minutes integer,
  source text not null default 'manual',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, metric_date)
);

create table public.garmin_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.garmin_connections(id) on delete set null,
  external_activity_id text,
  activity_type text not null,
  started_at timestamptz not null,
  duration_seconds integer,
  distance_meters numeric(10,2),
  calories integer,
  avg_heart_rate integer,
  max_heart_rate integer,
  training_effect numeric(4,2),
  intensity_score numeric(6,2),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, external_activity_id)
);

create table public.recovery_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garmin_daily_metric_id uuid references public.garmin_daily_metrics(id) on delete set null,
  score_date date not null,
  score integer not null check (score between 0 and 100),
  readiness_label text not null check (readiness_label in ('Low Recovery', 'Moderate Recovery', 'High Recovery')),
  suggested_training_intensity text not null,
  recommendation text not null,
  sleep_impact text,
  stress_impact text,
  training_load_impact text,
  weights jsonb not null default '{"hrv":0.3,"restingHeartRate":0.2,"sleep":0.25,"stress":0.1,"bodyBattery":0.1,"trainingLoad":0.05}'::jsonb,
  disclaimer text not null default 'Estimated personal readiness score only. Not medical advice.',
  created_at timestamptz not null default now(),
  unique (user_id, score_date)
);

create table public.recovery_score_factors (
  id uuid primary key default gen_random_uuid(),
  recovery_score_id uuid not null references public.recovery_scores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  factor_key text not null,
  label text not null,
  factor_score integer not null check (factor_score between 0 and 100),
  weight numeric(5,4) not null,
  impact text not null check (impact in ('positive', 'neutral', 'negative')),
  explanation text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_logs enable row level security;
alter table public.food_items enable row level security;
alter table public.food_logs enable row level security;
alter table public.recipes enable row level security;
alter table public.saved_meals enable row level security;
alter table public.ai_food_estimates enable row level security;
alter table public.user_food_corrections enable row level security;
alter table public.body_metrics enable row level security;
alter table public.progress_photos enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.goals enable row level security;
alter table public.journal_entries enable row level security;
alter table public.garmin_connections enable row level security;
alter table public.garmin_daily_metrics enable row level security;
alter table public.garmin_workouts enable row level security;
alter table public.recovery_scores enable row level security;
alter table public.recovery_score_factors enable row level security;

create policy "Users manage own profiles" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own records" on public.exercises
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id);
create policy "Users manage own workout plans" on public.workout_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own foods" on public.food_items
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
create policy "Users manage own food logs" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own recipes" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own meals" on public.saved_meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own ai estimates" on public.ai_food_estimates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own corrections" on public.user_food_corrections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own progress photos" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own sleep" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own garmin connections" on public.garmin_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own garmin daily metrics" on public.garmin_daily_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own garmin workouts" on public.garmin_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own recovery scores" on public.recovery_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own recovery score factors" on public.recovery_score_factors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.food_sources (name, priority)
values ('USDA FoodData Central', 1), ('Open Food Facts', 2)
on conflict (name) do nothing;
