import "dotenv/config";
import { analyticsSyncService } from "../src/services/analytics-sync.service";
import { db } from "../src/db/connect";
import { projects } from "../src/db/schema/schema";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  try {
    switch (command) {
      case "project": {
        if (!param) {
          console.error("❌ Please provide a project ID");
          process.exit(1);
        }
        const projectId = param;
        const date = args[2] || new Date().toISOString().split("T")[0];
        await analyticsSyncService.syncProjectData(projectId, date);
        break;
      }

      case "all": {
        const date = param || new Date().toISOString().split("T")[0];
        await analyticsSyncService.syncAllProjects(date);
        break;
      }

      case "yesterday": {
        await analyticsSyncService.syncYesterday();
        break;
      }

      case "today": {
        await analyticsSyncService.syncToday();
        break;
      }

      case "range": {
        const startDate = param;
        const endDate = args[2];
        if (!startDate || !endDate) {
          console.error("❌ Please provide start and end dates");
          process.exit(1);
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          await analyticsSyncService.syncAllProjects(dateStr);
        }

        break;
      }

      case "list": {
        const allProjects = await db.select().from(projects);

        if (allProjects.length === 0) {
        } else {
          for (const p of allProjects) {
          }
        }
        break;
      }

      default: {
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
