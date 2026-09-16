import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "./config.js";
import { SQL_DIR } from "./paths.js";

export async function runSqlFile(filename: string): Promise<void> {
  const filePath = resolve(SQL_DIR, filename);
  const content = readFileSync(filePath, "utf-8").trim();
  if (!content) return;

  console.log(`  Running ${filename}...`);
  await sql.unsafe(content);
  console.log(`  Done: ${filename}`);
}

export async function runSqlFiles(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await runSqlFile(filename);
  }
}

export async function close(): Promise<void> {
  await sql.end();
}
