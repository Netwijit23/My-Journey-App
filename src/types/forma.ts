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
