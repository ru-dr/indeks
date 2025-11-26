import { NextRequest, NextResponse } from "next/server";
import { analyticsSyncService } from "@/services/analytics-sync.service";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Configure in vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/sync-analytics",
//       "schedule": "0 */12 * * *"
//     }
//   ]
// }

export async function GET(request: NextRequest) {
  // Verify the request is from a valid cron source
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, validate the authorization header
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("Starting scheduled analytics sync...");
    
    // Get the date to sync (default to yesterday for daily sync)
    const searchParams = request.nextUrl.searchParams;
    const syncType = searchParams.get("type") || "yesterday";
    
    if (syncType === "yesterday") {
      await analyticsSyncService.syncYesterday();
    } else if (syncType === "today") {
      await analyticsSyncService.syncToday();
    } else {
      // Sync a specific date
      await analyticsSyncService.syncAllProjects(syncType);
    }

    return NextResponse.json({
      success: true,
      message: `Analytics sync completed for ${syncType}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics sync failed:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
