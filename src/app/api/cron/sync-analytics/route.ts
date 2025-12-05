import { NextRequest, NextResponse } from "next/server";
import { analyticsSyncService } from "@/services/analytics-sync.service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting scheduled analytics sync...");

    const searchParams = request.nextUrl.searchParams;
    const syncType = searchParams.get("type") || "yesterday";

    if (syncType === "yesterday") {
      await analyticsSyncService.syncYesterday();
    } else if (syncType === "today") {
      await analyticsSyncService.syncToday();
    } else {
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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
