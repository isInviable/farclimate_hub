import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
config({ path: resolve(__dirname, "..", "..", "..", ".env") });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  const r = await sql`SELECT public.get_filter_facets(NULL) as facets`;
  const facets = r[0]?.facets;
  if (!facets?.global) {
    console.error("4.1 FAIL: missing global");
    process.exit(1);
  }
  const keys = ["sectors", "climate_impacts", "adaptation_approaches", "keywords"];
  for (const k of keys) {
    if (!Array.isArray(facets.global[k])) {
      console.error("4.1 FAIL: global." + k + " not array");
      process.exit(1);
    }
    if (facets.global[k].length && (!("value" in facets.global[k][0]) || !("count" in facets.global[k][0]))) {
      console.error("4.1 FAIL: global." + k + " bad shape");
      process.exit(1);
    }
  }
  console.log("4.1 OK: global facets structure (value, count)");

  const ids = await sql`SELECT id FROM knowledge.documents LIMIT 2`;
  const docIds = ids.map((x) => x.id);
  if (docIds.length > 0) {
    const r2 = await sql`SELECT public.get_filter_facets(${docIds}) as facets`;
    const f2 = r2[0]?.facets;
    if (!f2?.for_result_set) {
      console.error("4.2 FAIL: missing for_result_set");
      process.exit(1);
    }
    for (const k of keys) {
      const gCount = (f2.global[k] || []).reduce((s, i) => s + (i.count || 0), 0);
      const rCount = (f2.for_result_set[k] || []).reduce((s, i) => s + (i.count || 0), 0);
      if (rCount > gCount) {
        console.error("4.2 FAIL: for_result_set." + k + " count > global");
        process.exit(1);
      }
    }
    console.log("4.2 OK: global and for_result_set present, result-set counts <= global");
  } else {
    console.log("4.2 SKIP: no documents in DB");
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
