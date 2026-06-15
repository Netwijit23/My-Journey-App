export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest?: string;
  tempo?: string;
  notes?: string;
};

export type WorkoutDay = {
  name: string;
  focus: string;
  exercises: WorkoutExercise[];
};

export type FoodEstimate = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  confidence: number;
  source: "verified" | "ai-estimate" | "manual";
};

export type MetricPoint = {
  date: string;
  weight: number;
  calories: number;
  protein: number;
  sleep: number;
  volume: number;
};

export type GarminDailyMetrics = {
  date: string;
  restingHeartRate: number;
  hrv: number;
  hrvBaseline: number;
  restingHeartRateBaseline: number;
  sleepDuration: number;
  sleepScore: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  stressScore: number;
  bodyBattery: number;
  trainingReadiness: number;
  trainingStatus: string;
  recoveryTimeHours: number;
  vo2Max: number;
  steps: number;
  caloriesBurned: number;
  workoutIntensity: number;
  intensityMinutes: number;
};

export type RecoveryScoreWeights = {
  hrv: number;
  restingHeartRate: number;
  sleep: number;
  stress: number;
  bodyBattery: number;
  trainingLoad: number;
};

export type RecoveryScoreFactor = {
  key: string;
  label: string;
  score: number;
  weight: number;
  impact: "positive" | "neutral" | "negative";
  explanation: string;
};

export type RecoveryScoreResult = {
  score: number;
  label: "Low Recovery" | "Moderate Recovery" | "High Recovery";
  suggestedIntensity: "Rest or mobility" | "Light technique work" | "Moderate training" | "Strength training is okay";
  recommendation: string;
  factors: RecoveryScoreFactor[];
  sleepImpact: string;
  stressImpact: string;
  trainingLoadImpact: string;
  disclaimer: string;
};

export type ChallengeWorkoutRow = [string, string, string, string];

export type ChallengeDay = {
  day: number;
  type: string;
  week: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cardio: string;
  workout: ChallengeWorkoutRow[];
  hook: string;
  title: string;
  angle: string;
};

export type ChallengeCheckpoint = {
  record: string[];
  expected: string;
  adjustment: string;
};

export type ChallengeProgram = {
  program_name: string;
  app_name: string;
  version: string;
  nutrition: {
    profile: Record<string, string | number>;
    targets: {
      training_day_calories: number;
      rest_day_calories: number;
      protein_g: number;
      fat_g: number;
      training_day_carbs_g: number;
      rest_day_carbs_g: number;
      water_liters: number;
      steps: number;
      sleep_hours: number;
    };
    meals_thailand: Array<{ name: string; foods: string[] }>;
    supplements_optional: string[];
  };
  rules: string[];
  tracking_schema: {
    daily_fields: Array<Record<string, unknown>>;
    score_formula: Record<string, number>;
  };
  checkpoints: Record<string, ChallengeCheckpoint>;
  adaptation_protocol: {
    missed_workout: string[];
    travel_hotel_gym: { instructions: string; workout: string[] };
    no_gym: { instructions: string; workout: string[] };
    sick: string[];
  };
  days: ChallengeDay[];
};

export type ChallengeDailyLog = {
  day: number;
  weightKg: string;
  waistCm: string;
  sleepHours: string;
  energyLevel: string;
  moodLevel: string;
  workoutCompleted: boolean;
  stepCount: string;
  calories: string;
  proteinG: string;
  waterLiters: string;
  notes: string;
  adaptationMode: "none" | "missed_workout" | "travel_hotel_gym" | "no_gym" | "sick";
  updatedAt?: string;
};

export type ChallengeCheckpointLog = {
  day: number;
  measurements: string;
  progress: string;
  adjustment: string;
  updatedAt?: string;
};
