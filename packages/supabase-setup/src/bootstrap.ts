import { close, listSqlFiles, runSqlFiles } from "./run-sql.js";

async function main() {
  const sqlFiles = listSqlFiles();

  console.log("Bootstrapping a brand-new Supabase environment...\n");

  if (sqlFiles.length === 0) {
    console.log("No SQL files found in packages/supabase-setup/sql.");
    await close();
    return;
  }

  await runSqlFiles(sqlFiles);

  console.log("\nSupabase bootstrap SQL completed successfully.");
  console.log("\nNext manual steps:");
  console.log(
    "  1. In Supabase Dashboard > Authentication > Hooks, set the Custom Access Token Hook to public.custom_access_token_hook."
  );
  console.log(
    "  2. After real users exist, grant elevated access with: select public.assign_connected_admin('<auth-user-id>'::uuid);"
  );
  console.log(
    "  3. Ask affected users to sign out/in or refresh their session so the new JWT claim appears."
  );

  await close();
}

main().catch(async (err) => {
  console.error("Failed to bootstrap Supabase setup:", err);
  await close();
  process.exit(1);
});
