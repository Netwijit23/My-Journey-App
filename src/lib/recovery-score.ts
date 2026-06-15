import type {
  GarminDailyMetrics,
  RecoveryScoreResult,
  RecoveryScoreWeights,
} from "@/types/forma";

export const defaultRecoveryWeights: RecoveryScoreWeights = {
  hrv: 0.3,
  restingHeartRate: 0.2,
  sleep: 0.25,
  stress: 0.1,
  bodyBattery: 0.1,
  trainingLoad: 0.05,
};

export function calculateRecoveryScore(
  metrics: GarminDailyMetrics,
  weights: RecoveryScoreWeights = defaultRecoveryWeights,
): RecoveryScoreResult {
  const hrvRatio = metrics.hrv / metrics.hrvBaseline;
  const rhrDelta = metrics.restingHeartRate - metrics.restingHeartRateBaseline;
  const sleepDurationScore = clamp((metrics.sleepDuration / 8) * 100);
  const sleepScore = clamp(metrics.sleepScore * 0.7 + sleepDurationScore * 0.3);
  const hrvScore = clamp(50 + (hrvRatio - 1) * 140);
  const rhrScore = clamp(82 - rhrDelta * 6);
  const stressScore = clamp(100 - metrics.stressScore);
  const bodyBatteryScore = clamp(metrics.bodyBattery);
  const trainingLoadScore = clamp(
    100 - metrics.recoveryTimeHours * 1.4 - metrics.workoutIntensity * 0.22,
  );

  const factors = [
    factor("hrv", "HRV vs baseline", hrvScore, weights.hrv, explainHrv(hrvRatio)),
    factor(
      "resting_heart_rate",
      "Resting heart rate",
      rhrScore,
      weights.restingHeartRate,
      explainRhr(rhrDelta),
    ),
    factor("sleep", "Sleep quality", sleepScore, weights.sleep, explainSleep(metrics)),
    factor("stress", "Stress load", stressScore, weights.stress, explainStress(metrics.stressScore)),
    factor(
      "body_battery",
      "Body Battery",
      bodyBatteryScore,
      weights.bodyBattery,
      explainBodyBattery(metrics.bodyBattery),
    ),
    factor(
      "training_load",
      "Training load",
      trainingLoadScore,
      weights.trainingLoad,
      explainTraining(metrics),
    ),
  ];

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const score = Math.round(
    factors.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight,
  );
  const label = score >= 70 ? "High Recovery" : score >= 40 ? "Moderate Recovery" : "Low Recovery";
  const suggestedIntensity =
    score >= 75
      ? "Strength training is okay"
      : score >= 60
        ? "Moderate training"
        : score >= 40
          ? "Light technique work"
          : "Rest or mobility";

  return {
    score,
    label,
    suggestedIntensity,
    recommendation:
      score >= 70
        ? "Strength training is okay today."
        : score >= 40
          ? "Keep training controlled and avoid chasing personal records."
          : "Prioritize recovery, easy movement, and sleep.",
    factors,
    sleepImpact: explainSleep(metrics),
    stressImpact: explainStress(metrics.stressScore),
    trainingLoadImpact: explainTraining(metrics),
    disclaimer:
      "Estimated personal readiness score only. It is not medical advice and should not be treated as a clinical measurement.",
  };
}

function factor(
  key: string,
  label: string,
  score: number,
  weight: number,
  explanation: string,
) {
  return {
    key,
    label,
    score: Math.round(score),
    weight,
    impact: score >= 70 ? "positive" : score >= 45 ? "neutral" : "negative",
    explanation,
  } as const;
}

function explainHrv(ratio: number) {
  if (ratio >= 1.05) return "HRV is above baseline.";
  if (ratio >= 0.95) return "HRV is near baseline.";
  return "HRV is below baseline.";
}

function explainRhr(delta: number) {
  if (delta <= -2) return "Resting heart rate is lower than baseline.";
  if (delta <= 2) return "Resting heart rate is normal.";
  return "Resting heart rate is elevated.";
}

function explainSleep(metrics: GarminDailyMetrics) {
  if (metrics.sleepScore >= 85 && metrics.sleepDuration >= 7.5) return "Sleep quality was strong.";
  if (metrics.sleepScore >= 70 && metrics.sleepDuration >= 6.5) return "Sleep was adequate.";
  return "Sleep may be limiting readiness.";
}

function explainStress(stressScore: number) {
  if (stressScore <= 30) return "Stress was low.";
  if (stressScore <= 55) return "Stress was manageable.";
  return "Stress was elevated.";
}

function explainBodyBattery(bodyBattery: number) {
  if (bodyBattery >= 75) return "Body Battery is high.";
  if (bodyBattery >= 50) return "Body Battery is moderate.";
  return "Body Battery is low.";
}

function explainTraining(metrics: GarminDailyMetrics) {
  if (metrics.recoveryTimeHours <= 12 && metrics.workoutIntensity <= 45) {
    return "Training load is manageable.";
  }
  if (metrics.recoveryTimeHours <= 30) return "Training load is moderate.";
  return "Recovery time remaining is high.";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
