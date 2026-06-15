import type { WorkoutDay } from "@/types/forma";

const dayPattern = /^(day\s*\d+|push|pull|legs|upper|lower|full body|workout\s*[a-z0-9]+)\s*:?\s*(.*)$/i;
const exercisePattern = /^(.+?)\s+(\d+)\s*[xX]\s*([\d\-+\/ ]+)(?:\s*@\s*([\w .+-]+))?$/;

export function parseWorkoutPlan(input: string): WorkoutDay[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);

  const days: WorkoutDay[] = [];
  let current: WorkoutDay | null = null;

  for (const line of lines) {
    const dayMatch = line.match(dayPattern);
    if (dayMatch && !line.match(exercisePattern)) {
      current = {
        name: titleCase(dayMatch[1]),
        focus: dayMatch[2] || "Custom session",
        exercises: [],
      };
      days.push(current);
      continue;
    }

    const exerciseMatch = line.match(exercisePattern);
    if (exerciseMatch) {
      if (!current) {
        current = { name: "Workout", focus: "Imported plan", exercises: [] };
        days.push(current);
      }
      current.exercises.push({
        name: exerciseMatch[1].trim(),
        sets: Number(exerciseMatch[2]),
        reps: exerciseMatch[3].trim(),
        weight: exerciseMatch[4]?.trim(),
        rest: "2:00",
      });
    }
  }

  return days;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/^Day\s*(\d+)$/, "Day $1");
}
