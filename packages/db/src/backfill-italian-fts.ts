import { runSqlFiles, close } from "./run-sql.js";

async function main() {
  console.log("Applying Italian FTS fix (trigger, search functions, backfill)...\n");

  await runSqlFiles(["03_triggers.sql", "04_search_functions.sql", "07_backfill_italian_fts.sql"]);

  console.log("\nItalian FTS backfill complete.");
  await close();
}

main().catch((err) => {
  console.error("Italian FTS backfill failed:", err);
  process.exit(1);
});
