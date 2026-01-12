import { NextResponse } from "next/server";
import { CURRENT_SEASON_YEAR } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron
 * Vercel Cron endpoint to automatically sync scores
 * Configure in vercel.json to run every 15 minutes during games
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the sync endpoint internally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        year: CURRENT_SEASON_YEAR,
        weeks: [1, 2, 3, 5],
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Cron sync completed",
      syncResult: result,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cron sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
