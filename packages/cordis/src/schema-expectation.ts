import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SQL_DIR } from "./paths.js";

// Minimal reader for the DDL this package owns. `sql/01_tables.sql` is limited
// to `create table if not exists` blocks with one column or table constraint
// per line, so a full SQL parser would be overkill; anything it cannot classify
// is surfaced as an unparsed line rather than silently dropped.

export type ExpectedColumn = {
  name: string;
  type: string;
  notNull: boolean;
  default: string | null;
  references: string | null;
  /** True for serial/bigserial, whose default is an implicit nextval(). */
  autoIncrement: boolean;
};

export type ExpectedTable = {
  name: string;
  columns: ExpectedColumn[];
  constraints: string[];
  indexes: string[];
  /** Column name -> comment text, from `comment on column` statements. */
  comments: Map<string, string>;
};

export type ExpectedPolicy = {
  table: string;
  name: string;
  command: string;
  roles: string;
  referencesAdminClaim: boolean;
};

/** Maps the DDL's type spellings onto information_schema.columns.data_type. */
const TYPE_ALIASES = new Map<string, string>([
  ["serial", "integer"],
  ["bigserial", "bigint"],
  ["int", "integer"],
  ["int4", "integer"],
  ["int8", "bigint"],
  ["float8", "double precision"],
  ["timestamptz", "timestamp with time zone"],
  ["bool", "boolean"],
]);

export function normaliseType(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, " ");
  // information_schema reports every array type as the literal "ARRAY".
  if (cleaned.endsWith("[]") || cleaned === "array") return "ARRAY";
  return TYPE_ALIASES.get(cleaned) ?? cleaned;
}

/** Splits on commas that are not nested inside parentheses. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

const CONSTRAINT_PREFIXES = ["primary key", "unique", "foreign key", "check", "constraint", "exclude"];

function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, "");
}

export function readExpectedSchema(sqlDir = SQL_DIR): {
  tables: Map<string, ExpectedTable>;
  unparsed: string[];
} {
  const tablesSql = stripComments(readFileSync(resolve(sqlDir, "01_tables.sql"), "utf8"));
  const tables = new Map<string, ExpectedTable>();
  const unparsed: string[] = [];

  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)\s*\(([\s\S]*?)\n\)\s*;/gi;
  for (const match of tablesSql.matchAll(tableRe)) {
    const [, tableName, body] = match;
    const columns: ExpectedColumn[] = [];
    const constraints: string[] = [];

    for (const item of splitTopLevel(body)) {
      const normalised = item.replace(/\s+/g, " ").trim();
      const lower = normalised.toLowerCase();

      if (CONSTRAINT_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
        constraints.push(normalised);
        continue;
      }

      const columnMatch = normalised.match(/^"?([a-z0-9_]+)"?\s+(.*)$/i);
      if (!columnMatch) {
        unparsed.push(`${tableName}: ${normalised}`);
        continue;
      }

      const [, name, rest] = columnMatch;
      const notNull = /\bnot\s+null\b/i.test(rest);
      const autoIncrement = /^\s*(?:big)?serial\b/i.test(rest);
      const defaultMatch = rest.match(/\bdefault\s+(.+?)(?=\s+(?:not\s+null|references|primary\s+key|unique|check)\b|$)/i);
      const referencesMatch = rest.match(/\breferences\s+([a-z0-9_.]+)\s*\(\s*([a-z0-9_]+)\s*\)/i);

      // Everything before the first modifier keyword is the type.
      const typeMatch = rest.match(
        /^(.*?)(?=\s+(?:primary\s+key|not\s+null|null\b|default|references|unique|check)\b|$)/i,
      );

      columns.push({
        name,
        type: normaliseType(typeMatch?.[1] ?? rest),
        notNull: notNull || /\bprimary\s+key\b/i.test(rest),
        default: defaultMatch?.[1]?.trim() ?? null,
        references: referencesMatch ? `${referencesMatch[1]}(${referencesMatch[2]})` : null,
        autoIncrement,
      });

      if (/\bprimary\s+key\b/i.test(rest)) constraints.push(`PRIMARY KEY (${name})`);
      if (/\bunique\b/i.test(rest)) constraints.push(`UNIQUE (${name})`);
    }

    tables.set(tableName, {
      name: tableName,
      columns,
      constraints,
      indexes: [],
      comments: new Map(),
    });
  }

  const indexRe = /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+on\s+public\.([a-z0-9_]+)\s*\(([^)]*)\)/gi;
  for (const match of tablesSql.matchAll(indexRe)) {
    const [, indexName, tableName, columnList] = match;
    tables.get(tableName)?.indexes.push(`${indexName} (${columnList.replace(/\s+/g, " ").trim()})`);
  }

  const commentRe =
    /comment\s+on\s+column\s+public\.([a-z0-9_]+)\."?([a-z0-9_]+)"?\s+is\s+'((?:[^']|'')*)'/gi;
  for (const match of tablesSql.matchAll(commentRe)) {
    const [, tableName, columnName, comment] = match;
    tables.get(tableName)?.comments.set(columnName, comment.replace(/''/g, "'"));
  }

  return { tables, unparsed };
}

export function readExpectedPolicies(sqlDir = SQL_DIR): ExpectedPolicy[] {
  const rlsSql = stripComments(readFileSync(resolve(sqlDir, "02_rls.sql"), "utf8"));
  const policies: ExpectedPolicy[] = [];

  const policyRe =
    /create\s+policy\s+"([^"]+)"\s+on\s+public\.([a-z0-9_]+)\s+(?:as\s+\w+\s+)?for\s+([a-z]+)\s+to\s+([^\n]+?)\s*\n([\s\S]*?);/gi;
  for (const match of rlsSql.matchAll(policyRe)) {
    const [, name, table, command, roles, expressions] = match;
    policies.push({
      table,
      name,
      command: command.toUpperCase(),
      roles: roles.trim(),
      referencesAdminClaim: /connected_admin/i.test(expressions),
    });
  }

  // Single-line variants (`... using (true);` on the same line as `create policy`).
  const inlineRe =
    /create\s+policy\s+"([^"]+)"\s+on\s+public\.([a-z0-9_]+)\s+for\s+([a-z]+)\s+to\s+([a-z,\s]+?)\s+(using|with\s+check)\s*\(([\s\S]*?)\)\s*;/gi;
  for (const match of rlsSql.matchAll(inlineRe)) {
    const [, name, table, command, roles, , expression] = match;
    if (policies.some((policy) => policy.name === name && policy.table === table)) continue;
    policies.push({
      table,
      name,
      command: command.toUpperCase(),
      roles: roles.trim(),
      referencesAdminClaim: /connected_admin/i.test(expression),
    });
  }

  return policies;
}
