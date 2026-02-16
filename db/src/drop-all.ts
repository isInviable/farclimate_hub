import { runSqlFile, close } from "./run-sql.js";

async function main() {
  console.log("Dropping knowledge schema (CASCADE)...\n");
  console.log("  NOTE: Only the 'knowledge' schema is affected.");
  console.log("  The 'public' schema and all its tables remain untouched.\n");

  await runSqlFile("drop_knowledge.sql");

  console.log("\nKnowledge schema dropped.");
  await close();
}

main().catch((err) => {
  console.error("Failed to drop schema:", err);
  process.exit(1);
});
