import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env file.");
  console.error(
    "Do not point this at hosted production unless you intend a CORDIS refresh.",
  );
  process.exit(1);
}

export const sql = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});
