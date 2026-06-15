import { NextRequest, NextResponse } from "next/server";

import { estimateFoods } from "@/lib/food-estimator";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { input?: string };
  const estimates = estimateFoods(body.input ?? "");

  return NextResponse.json({
    estimates,
    source: process.env.CLAUDE_API_KEY ? "claude-ready" : "local-estimator",
    disclaimer: "AI estimates are unverified until matched or corrected.",
  });
}
