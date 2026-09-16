import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = resolve(PACKAGE_ROOT, "data");
export const DEFAULT_SOURCES_PATH = resolve(DATA_DIR, "sources.csv");
export const DEFAULT_RISKS_CSV_PATH = resolve(DATA_DIR, "project_climate_risks.csv");
export const DEFAULT_THEMES_CSV_PATH = resolve(DATA_DIR, "project_main_themes.csv");
export const DEFAULT_DOWNLOADS_DIR = resolve(DATA_DIR, "downloads");
export const DEFAULT_CSV_DIR = resolve(DATA_DIR, "csv");
export const DEFAULT_AUDIT_DIR = resolve(DATA_DIR, "audit_output");
export const DEFAULT_FIXTURES_DIR = resolve(PACKAGE_ROOT, "fixtures");
export const SQL_DIR = resolve(PACKAGE_ROOT, "sql");

export function getArgValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const prefix = `${name}=`;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(prefix)) return args[i].slice(prefix.length);
    if (args[i] === name && args[i + 1] && !args[i + 1].startsWith("-")) {
      return args[i + 1];
    }
  }
  return undefined;
}

export function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(name);
}
