import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(import.meta.dirname, "..", "..", "..", ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env file.");
  console.error(
    "Get it from Supabase Dashboard > Settings > Database > Connection string (direct)."
  );
  process.exit(1);
}

export const sql = postgres(DATABASE_URL, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});
