import { NextRequest, NextResponse } from "next/server";

const SHEETDB_API = "https://sheetdb.io/api/v1/0vrsqfj4oho3t";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const batchSize = 100;
    let totalCreated = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const sheetResponse = await fetch(SHEETDB_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: batch }),
      });

      if (!sheetResponse.ok) {
        const errorText = await sheetResponse.text();
        console.error("SheetDB error:", errorText);
        return NextResponse.json(
          {
            error: `Failed to save batch ${Math.floor(i / batchSize) + 1}: ${errorText}`,
          },
          { status: 500 },
        );
      }

      const result = await sheetResponse.json();
      totalCreated += result.created || batch.length;
    }

    return NextResponse.json({
      success: true,
      created: totalCreated,
      message: `Successfully exported ${totalCreated} rows to Google Sheets`,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export data",
      },
      { status: 500 },
    );
  }
}
