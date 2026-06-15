import { NextRequest, NextResponse } from "next/server";

import { parseWorkoutPlan } from "@/lib/workout-parser";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: string };
  const days = parseWorkoutPlan(body.text ?? "");

  return NextResponse.json({
    days,
    detectedDays: days.length,
    detectedExercises: days.reduce((count, day) => count + day.exercises.length, 0),
  });
}
