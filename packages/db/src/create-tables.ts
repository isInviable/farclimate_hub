import { runSqlFiles, close } from "./run-sql.js";

async function main() {
  console.log("Creating knowledge schema and tables...\n");

  await runSqlFiles([
    "01_schema_and_extensions.sql",
    "02_tables.sql",
    "03_triggers.sql",
    "04_search_functions.sql",
    "05_facet_functions.sql",
    "06_public_api.sql",
  ]);

  console.log("\nAll tables created successfully.");
  await close();
}

main().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
