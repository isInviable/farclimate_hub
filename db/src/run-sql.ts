import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "./config.js";

const SQL_DIR = resolve(import.meta.dirname, "..", "sql");

/**
 * Execute a .sql file from the sql/ directory.
 * Returns the result of the last statement.
 */
export async function runSqlFile(filename: string): Promise<void> {
  const filePath = resolve(SQL_DIR, filename);
  const content = readFileSync(filePath, "utf-8").trim();
  if (!content) return;

  console.log(`  Running ${filename}...`);
  await sql.unsafe(content);
  console.log(`  Done: ${filename}`);
}

/**
 * Execute multiple .sql files in order.
 */
export async function runSqlFiles(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await runSqlFile(filename);
  }
}

/**
 * Close the database connection.
 */
export async function close(): Promise<void> {
  await sql.end();
}
