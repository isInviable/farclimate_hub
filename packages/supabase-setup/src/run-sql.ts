import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "./config.js";

const SQL_DIR = resolve(import.meta.dirname, "..", "sql");

export function listSqlFiles(): string[] {
  return readdirSync(SQL_DIR)
    .filter((filename) => filename.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

export async function runSqlFile(filename: string): Promise<void> {
  const filePath = resolve(SQL_DIR, filename);
  const content = readFileSync(filePath, "utf-8").trim();

  if (!content) {
    return;
  }

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
