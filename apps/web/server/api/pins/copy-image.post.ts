/**
 * Stub for copying external images into `human-pin-images` storage.
 * Implement signed upload + path convention (see `human-pin-storage` / supabase-setup).
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 501);
  return {
    ok: false,
    message:
      "Not implemented — use Storage + RLS per human-pin-storage (first path segment = auth.uid()).",
  };
});
