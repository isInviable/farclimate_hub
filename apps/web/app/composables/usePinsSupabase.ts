import type { HumanPinRow, PinBodyV1 } from "~/types/pins";
import { emptyPinBody } from "~/types/pins";

/** Shape consumed by `BoardList.vue` (legacy categories). */
export interface BoardListPinnedItem {
  id: string
  title: string
  type: "result" | "contact" | "image" | "website" | "other"
  data: Record<string, unknown>
  notes?: string
  /** When set, pin is linked to a catalog document (open-in-explorer when route supports it). */
  source_document_uid?: string | null
  /** Original `human.pins.body_kind` for debugging / future grouping. */
  body_kind?: string
}

export function humanPinToBoardItem(pin: HumanPinRow): BoardListPinnedItem {
  const data = boardDataFromPin(pin)
  const type = mapBodyKindToBoardType(pin.body_kind, data)
  return {
    id: pin.id,
    title: pin.source_title_snapshot?.trim() || "(no title)",
    type,
    data,
    notes: pin.user_note?.trim() || undefined,
    source_document_uid: pin.source_document_uid,
    body_kind: pin.body_kind,
  }
}

function mapBodyKindToBoardType(
  kind: string,
  data: Record<string, unknown>
): BoardListPinnedItem["type"] {
  if (kind === "image") return "image"
  if (kind === "website") return "website"
  if (kind === "contact") return "contact"
  if (
    kind === "text_segment" ||
    kind === "selected_text" ||
    kind === "recipe_section" ||
    kind === "ai_summary" ||
    kind === "grid_compare_summary" ||
    kind === "markmap" ||
    kind === "chat_response" ||
    kind === "reference" ||
    kind === "document" ||
    kind === "section"
  )
    return "result"
  if (kind === "chat") return "other"
  const src = data.src
  if (typeof src === "string" && src.length > 0) return "image"
  const url = data.url
  if (typeof url === "string" && url.length > 0) return "website"
  return "other"
}

function boardDataFromPin(pin: HumanPinRow): Record<string, unknown> {
  const raw = pin.body?.data
  const d =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {}

  if (pin.body_kind === "chat" && Array.isArray(d.messages)) {
    const msgs = d.messages as Array<{ text?: string }>
    const text = msgs.map((m) => m.text ?? "").join("\n").trim()
    if (text && !d.description) d.description = text.slice(0, 800)
  }

  if (pin.body_kind === "selected_text" && typeof d.quote === "string" && !d.markdown) {
    d.markdown = d.quote
  }

  if (pin.body_kind === "chat_response" && typeof d.text === "string" && !d.markdown) {
    d.markdown = d.text
  }

  if (
    pin.body_kind === "grid_compare_summary" &&
    typeof d.markdown !== "string" &&
    (typeof d.data === "string" || typeof d.summary === "string")
  ) {
    const a = typeof d.data === "string" ? d.data.trim() : ""
    const b = typeof d.summary === "string" ? d.summary.trim() : ""
    d.markdown = [a, b].filter(Boolean).join("\n\n")
  }

  if (pin.body_kind === "markmap" && typeof d.markdown !== "string") {
    const raw = typeof d.content === "string" ? d.content.trim() : ""
    if (raw) d.markdown = raw
  }

  if (pin.body_kind === "image" && typeof d.src !== "string") {
    d.description =
      "Image preview is not wired yet (signed URLs / server route — see human-pin-storage)."
  }

  return d
}

export function usePinsSupabase() {
  const supabase = useSupabaseClient();
  const { isAuthenticated, requireAuthForPersistence } = useAccess();
  const { t } = useI18n();

  /** Shared across all callers (header, board, list, pin control). */
  const pinboardId = useState<string | null>("human-pins-pinboard-id", () => null);
  const pins = useState<HumanPinRow[]>("human-pins-rows", () => []);
  /** Set by `loadPinsForProject` so update/reorder can reload without touching the projects store. */
  const lastLoadedProjectId = useState<string | null>(
    "human-pins-last-project-id",
    () => null
  );
  const loading = useState<boolean>("human-pins-loading", () => false);
  const error = useState<string | null>("human-pins-error", () => null);

  /** True when a **full-document** pin (`body_kind === "document"`) exists for this uid. */
  function isDocumentPinned(documentUid: string | undefined | null): boolean {
    if (!documentUid) return false;
    return pins.value.some(
      (p) =>
        p.source_document_uid === documentUid && p.body_kind === "document",
    );
  }

  /**
   * Pin id for unpinning the whole-document pin from search / explorer row.
   * Fragment pins on the same `source_document_uid` are ignored.
   */
  function findPinIdByDocumentUid(
    documentUid: string | undefined | null,
  ): string | null {
    if (!documentUid) return null;
    const row = pins.value.find(
      (p) =>
        p.source_document_uid === documentUid && p.body_kind === "document",
    );
    return row?.id ?? null;
  }

  async function ensurePinboardForProject(projectId: string | null): Promise<string | null> {
    if (!projectId || !isAuthenticated.value) {
      pinboardId.value = null;
      return null;
    }
    const { data: existing, error: e1 } = await supabase
      .schema("human")
      .from("pinboards")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();
    if (e1) throw e1;
    if (existing?.id) {
      pinboardId.value = existing.id;
      return existing.id;
    }
    if (!requireAuthForPersistence()) return null;
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return null;
    const { data: created, error: e2 } = await supabase
      .schema("human")
      .from("pinboards")
      .insert({
        project_id: projectId,
        owner_user_id: authData.user.id,
        title: "Default",
      })
      .select("id")
      .single();
    if (e2) throw e2;
    pinboardId.value = created.id;
    return created.id;
  }

  async function loadPinsForProject(projectId: string | null) {
    lastLoadedProjectId.value = projectId;
    if (!projectId || !isAuthenticated.value) {
      pins.value = [];
      pinboardId.value = null;
      error.value = null;
      return;
    }

    pins.value = [];
    pinboardId.value = null;
    error.value = null;

    loading.value = true;
    try {
      const boardId = await ensurePinboardForProject(projectId);
      if (!boardId) return;
      const { data, error: e } = await supabase
        .schema("human")
        .from("pins")
        .select(
          "id, pinboard_id, source_document_uid, source_title_snapshot, body_kind, body, user_note, sort_order, created_at, updated_at"
        )
        .eq("pinboard_id", boardId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (e) throw e;
      pins.value = (data ?? []) as HumanPinRow[];
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("pins.errors.load");
      pins.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createPin(input: {
    projectId: string
    body_kind: string
    body: PinBodyV1
    source_document_uid?: string | null
    source_title_snapshot?: string | null
    user_note?: string | null
  }): Promise<HumanPinRow | null> {
    if (!requireAuthForPersistence()) return null;
    loading.value = true;
    error.value = null;
    try {
      const boardId = await ensurePinboardForProject(input.projectId);
      if (!boardId) return null;
      const maxOrder =
        pins.value.length > 0
          ? Math.max(...pins.value.map((p) => p.sort_order ?? 0))
          : -1;
      const nextOrder = maxOrder + 1;
      const { data, error: e } = await supabase
        .schema("human")
        .from("pins")
        .insert({
          pinboard_id: boardId,
          source_document_uid: input.source_document_uid ?? null,
          source_title_snapshot: input.source_title_snapshot ?? null,
          body_kind: input.body_kind,
          body: input.body as unknown as Record<string, unknown>,
          user_note: input.user_note ?? null,
          sort_order: nextOrder,
        })
        .select(
          "id, pinboard_id, source_document_uid, source_title_snapshot, body_kind, body, user_note, sort_order, created_at, updated_at"
        )
        .single();
      if (e) throw e;
      const row = data as HumanPinRow;
      pins.value = [...pins.value, row].sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
      );
      return row;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("pins.errors.create");
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updatePin(
    id: string,
    patch: Partial<
      Pick<
        HumanPinRow,
        | "source_title_snapshot"
        | "user_note"
        | "body_kind"
        | "body"
        | "sort_order"
      >
    >
  ): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    loading.value = true;
    error.value = null;
    try {
      const payload: Record<string, unknown> = { ...patch };
      if (patch.body !== undefined)
        payload.body = patch.body as unknown as Record<string, unknown>;
      const { error: e } = await supabase
        .schema("human")
        .from("pins")
        .update(payload)
        .eq("id", id);
      if (e) throw e;
      await loadPinsForProject(lastLoadedProjectId.value);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("pins.errors.update");
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deletePin(id: string): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    loading.value = true;
    error.value = null;
    try {
      const { error: e } = await supabase
        .schema("human")
        .from("pins")
        .delete()
        .eq("id", id);
      if (e) throw e;
      pins.value = pins.value.filter((p) => p.id !== id);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("pins.errors.delete");
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function reorderPins(orderedIds: string[]): Promise<boolean> {
    if (!requireAuthForPersistence()) return false;
    const board = pinboardId.value;
    if (!board) return false;
    loading.value = true;
    error.value = null;
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error: e } = await supabase
          .schema("human")
          .from("pins")
          .update({ sort_order: i })
          .eq("id", orderedIds[i])
          .eq("pinboard_id", board);
        if (e) throw e;
      }
      await loadPinsForProject(lastLoadedProjectId.value);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : t("pins.errors.reorder");
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPinCountsByProjectId(
    projectIds: string[]
  ): Promise<Record<string, number>> {
    const out: Record<string, number> = {};
    if (!isAuthenticated.value || projectIds.length === 0) return out;
    const { data: boards, error: e1 } = await supabase
      .schema("human")
      .from("pinboards")
      .select("id, project_id")
      .in("project_id", projectIds);
    if (e1 || !boards?.length) return out;
    const boardIds = boards.map((b) => b.id as string);
    const projectByBoard = new Map(
      boards.map((b) => [b.id as string, b.project_id as string])
    );
    const { data: pinRows, error: e2 } = await supabase
      .schema("human")
      .from("pins")
      .select("pinboard_id")
      .in("pinboard_id", boardIds);
    if (e2 || !pinRows) return out;
    for (const row of pinRows) {
      const pid = projectByBoard.get(row.pinboard_id as string);
      if (!pid) continue;
      out[pid] = (out[pid] ?? 0) + 1;
    }
    return out;
  }

  const boardItems = computed(() => pins.value.map(humanPinToBoardItem));

  return {
    pinboardId,
    pins,
    boardItems,
    loading,
    error,
    isDocumentPinned,
    findPinIdByDocumentUid,
    ensurePinboardForProject,
    loadPinsForProject,
    createPin,
    updatePin,
    deletePin,
    reorderPins,
    fetchPinCountsByProjectId,
    emptyPinBody,
  };
}
