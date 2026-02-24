import { runSqlFile, close } from "./run-sql.js";

async function main() {
  console.log("Truncating all knowledge tables (keeping structure)...\n");

  await runSqlFile("truncate_knowledge.sql");

  console.log("\nAll knowledge data deleted. Tables still exist.");
  await close();
}

main().catch((err) => {
  console.error("Failed to truncate:", err);
  process.exit(1);
});
