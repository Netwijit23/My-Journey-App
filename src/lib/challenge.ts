import type { ChallengeDailyLog, ChallengeDay } from "@/types/forma";

export const challengeStorageKey = "my-journey-ai-fitness-challenge";

export function createEmptyDailyLog(day: number): ChallengeDailyLog {
  return {
    day,
    weightKg: "",
    waistCm: "",
    sleepHours: "",
    energyLevel: "7",
    moodLevel: "7",
    workoutCompleted: false,
    stepCount: "",
    calories: "",
    proteinG: "",
    waterLiters: "",
    notes: "",
    adaptationMode: "none",
  };
}

export function calculateDailyChallengeScore(log: ChallengeDailyLog) {
  let score = 0;
  if (Number(log.weightKg) > 0) score += 10;
  if (Number(log.waistCm) > 0) score += 10;
  if (Number(log.sleepHours) >= 7.5) score += 15;
  if (Number(log.stepCount) >= 10000) score += 15;
  if (log.workoutCompleted) score += 20;
  if (Number(log.proteinG) >= 220) score += 20;
  if (Number(log.waterLiters) >= 3) score += 10;
  return score;
}

export function isChallengeDayComplete(log: ChallengeDailyLog) {
  return calculateDailyChallengeScore(log) >= 80 || log.workoutCompleted;
}

export function challengeStreak(logs: Record<number, ChallengeDailyLog>) {
  let streak = 0;
  for (let day = 1; day <= 30; day += 1) {
    const log = logs[day];
    if (!log || !isChallengeDayComplete(log)) {
      if (day === 1) return 0;
      break;
    }
    streak += 1;
  }
  return streak;
}

export function challengeLogsToCsv(days: ChallengeDay[], logs: Record<number, ChallengeDailyLog>) {
  const header = [
    "day",
    "type",
    "score",
    "weight_kg",
    "waist_cm",
    "sleep_hours",
    "energy_level",
    "mood_level",
    "workout_completed",
    "step_count",
    "calories",
    "protein_g",
    "water_liters",
    "adaptation_mode",
    "notes",
  ];
  const rows = days.map((day) => {
    const log = logs[day.day] ?? createEmptyDailyLog(day.day);
    return [
      day.day,
      day.type,
      calculateDailyChallengeScore(log),
      log.weightKg,
      log.waistCm,
      log.sleepHours,
      log.energyLevel,
      log.moodLevel,
      log.workoutCompleted ? "yes" : "no",
      log.stepCount,
      log.calories,
      log.proteinG,
      log.waterLiters,
      log.adaptationMode,
      log.notes,
    ].map(csvCell);
  });
  return [header, ...rows].map((row) => row.join(",")).join("\n");
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
