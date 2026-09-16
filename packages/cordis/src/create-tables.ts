import { hasFlag } from "./paths.js";
import { close, runSqlFiles } from "./run-sql.js";

// 01_tables.sql is additive and idempotent (create table / create index /
// comment on, all if-not-exists), so it is safe to re-run anywhere.
//
// 02_rls.sql is not: the hosted database was secured by hand under different
// policy names, so running it would add policies alongside the permissive live
// ones rather than replacing them, leaving the catalogue writable by any
// authenticated user. It is gated behind an explicit flag. See 02_rls.sql.

async function main() {
  const tablesOnly = hasFlag("--tables-only");
  const includeRls = hasFlag("--with-rls");

  if (!tablesOnly && !includeRls) {
    console.error(
      [
        "Refusing to run without an explicit mode.",
        "",
        "  --tables-only   apply 01_tables.sql only (safe: additive and idempotent,",
        "                  this is what you want against the hosted project)",
        "  --with-rls      also apply 02_rls.sql (FRESH DATABASES ONLY -- against",
        "                  hosted it adds policies next to the existing permissive",
        "                  ones instead of replacing them; read 02_rls.sql first)",
        "",
        "Run `pnpm cordis:drift` first to see how the target differs from sql/.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const files = includeRls ? ["01_tables.sql", "02_rls.sql"] : ["01_tables.sql"];
  console.log(`Applying ${files.join(", ")} (IF NOT EXISTS)...\n`);
  await runSqlFiles(files);
  console.log("\nCORDIS schema statements applied.");
  await close();
}

main().catch(async (err) => {
  console.error("Failed to apply CORDIS schema:", err);
  await close().catch(() => undefined);
  process.exit(1);
});
