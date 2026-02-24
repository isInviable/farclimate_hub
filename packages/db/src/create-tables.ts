import { runSqlFiles, close } from "./run-sql.js";

async function main() {
  console.log("Creating knowledge schema and tables...\n");

  await runSqlFiles([
    "00_create_schema.sql",
    "01_create_documents.sql",
    "02_create_summary.sql",
    "03_create_summary_multilang.sql",
    "04_create_fulltext.sql",
  ]);

  console.log("\nAll tables created successfully.");
  await close();
}

main().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
