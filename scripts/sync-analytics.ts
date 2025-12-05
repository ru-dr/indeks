import "dotenv/config";
import { analyticsSyncService } from "../src/services/analytics-sync.service";
import { db } from "../src/db/connect";
import { projects } from "../src/db/schema/schema";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  console.log("🚀 Analytics Sync Script");
  console.log("========================\n");

  try {
    switch (command) {
      case "project": {
        if (!param) {
          console.error("❌ Please provide a project ID");
          console.log(
            "Usage: npx tsx scripts/sync-analytics.ts project <projectId> [date]",
          );
          process.exit(1);
        }
        const projectId = param;
        const date = args[2] || new Date().toISOString().split("T")[0];
        console.log(`📊 Syncing project ${projectId} for date ${date}...`);
        await analyticsSyncService.syncProjectData(projectId, date);
        console.log("✅ Sync completed!");
        break;
      }

      case "all": {
        const date = param || new Date().toISOString().split("T")[0];
        console.log(`📊 Syncing all projects for date ${date}...`);
        await analyticsSyncService.syncAllProjects(date);
        console.log("✅ Sync completed!");
        break;
      }

      case "yesterday": {
        console.log("📊 Syncing all projects for yesterday...");
        await analyticsSyncService.syncYesterday();
        console.log("✅ Sync completed!");
        break;
      }

      case "today": {
        console.log("📊 Syncing all projects for today...");
        await analyticsSyncService.syncToday();
        console.log("✅ Sync completed!");
        break;
      }

      case "range": {
        const startDate = param;
        const endDate = args[2];
        if (!startDate || !endDate) {
          console.error("❌ Please provide start and end dates");
          console.log(
            "Usage: npx tsx scripts/sync-analytics.ts range <startDate> <endDate>",
          );
          process.exit(1);
        }

        console.log(
          `📊 Syncing all projects from ${startDate} to ${endDate}...`,
        );

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          console.log(`\n📅 Processing ${dateStr}...`);
          await analyticsSyncService.syncAllProjects(dateStr);
        }

        console.log("\n✅ Range sync completed!");
        break;
      }

      case "list": {
        console.log("📋 Listing all projects...\n");
        const allProjects = await db.select().from(projects);

        if (allProjects.length === 0) {
          console.log("No projects found.");
        } else {
          console.log("ID\t\t\t\t\t\tTitle\t\tActive");
          console.log("-".repeat(80));
          for (const p of allProjects) {
            console.log(`${p.id}\t${p.title}\t\t${p.isActive ? "✅" : "❌"}`);
          }
        }
        break;
      }

      default: {
        console.log("📖 Usage:");
        console.log("");
        console.log("  Sync a specific project for a date:");
        console.log(
          "    npx tsx scripts/sync-analytics.ts project <projectId> [date]",
        );
        console.log("");
        console.log("  Sync all projects for a specific date:");
        console.log("    npx tsx scripts/sync-analytics.ts all [date]");
        console.log("");
        console.log("  Sync all projects for yesterday:");
        console.log("    npx tsx scripts/sync-analytics.ts yesterday");
        console.log("");
        console.log("  Sync all projects for today:");
        console.log("    npx tsx scripts/sync-analytics.ts today");
        console.log("");
        console.log("  Sync a date range:");
        console.log(
          "    npx tsx scripts/sync-analytics.ts range <startDate> <endDate>",
        );
        console.log("");
        console.log("  List all projects:");
        console.log("    npx tsx scripts/sync-analytics.ts list");
        console.log("");
        console.log("📅 Date format: YYYY-MM-DD (e.g., 2025-11-26)");
        break;
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
