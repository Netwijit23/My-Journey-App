import { NextRequest, NextResponse } from "next/server";

import {
  calculateRecoveryScore,
  defaultRecoveryWeights,
} from "@/lib/recovery-score";
import { todaysGarminMetrics } from "@/lib/mock-data";
import type { GarminDailyMetrics, RecoveryScoreWeights } from "@/types/forma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    metrics?: GarminDailyMetrics;
    weights?: RecoveryScoreWeights;
  };
  const metrics = body.metrics ?? todaysGarminMetrics;
  const weights = body.weights ?? defaultRecoveryWeights;
  const recovery = calculateRecoveryScore(metrics, weights);

  return NextResponse.json({
    recovery,
    weights,
    inputMode: "garmin-api-or-manual-entry",
  });
}
