import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as csvStringify } from "csv-stringify/sync";

export function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`;
}

export async function writeTextReport(
  outDir: string,
  filename: string,
  contents: string,
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const path = resolve(outDir, filename);
  await writeFile(path, contents, "utf8");
  return path;
}

export async function writeCsvReport(
  outDir: string,
  filename: string,
  columns: string[],
  records: Record<string, unknown>[],
): Promise<string> {
  await mkdir(outDir, { recursive: true });
  const path = resolve(outDir, filename);
  await writeFile(path, csvStringify(records, { header: true, columns }), "utf8");
  return path;
}

/** Renders a GitHub-flavoured markdown table, or a placeholder when empty. */
export function markdownTable(
  headers: string[],
  rows: (string | number)[][],
  emptyNote = "_none_",
): string {
  if (rows.length === 0) return emptyNote;
  const escape = (value: string | number) => String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

export function truncate(value: string, max = 80): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}
