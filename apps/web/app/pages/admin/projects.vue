<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import type { ProjectRow } from "~/types/cordis";
import { handleAuthError } from "~/utils/authErrorHandler";

const supabase = useSupabaseClient();

const { isAuthenticated } = useAuth();
const router = useRouter();

const pageSize = 20;

const items = ref<ProjectRow[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const error = ref("");

const allClimateRisks = ref<{ id: number; name: string }[]>([]);
const allThemes = ref<{ id: number; name: string }[]>([]);
const selectedRiskIds = ref<number[]>([]);
const selectedThemeIds = ref<number[]>([]);

const isEditing = ref(false);
const originalId = ref<string | null>(null);
const formData = ref<ProjectRow | Record<string, any>>({} as ProjectRow);

const columns = [
  { id: "actions", header: "Actions", size: 100 },
  { accessorKey: "acronym", header: "Acronym", size: 150 },
  { accessorKey: "themes_labels", header: "Themes" },
  { accessorKey: "risks_labels", header: "Climate risks" },
  { accessorKey: "entities_labels", header: "Entities" },
  { accessorKey: "teaser", header: "Teaser" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "keywords", header: "Keywords" },
  { accessorKey: "total_cost", header: "Total cost" },
  {
    accessorKey: "ec_max_contribution",
    header: "EC max contribution",
  },
  { accessorKey: "start_date", header: "Start date" },
  { accessorKey: "end_date", header: "End date" },
  { accessorKey: "duration", header: "Duration (months)" },
] as any;

const columnPinning = ref({
  left: ["actions", "acronym"],
});

const riskItems = computed(() =>
  allClimateRisks.value.map((r) => ({ label: r.name, id: r.id }))
);
const themeItems = computed(() =>
  allThemes.value.map((t) => ({ label: t.name, id: t.id }))
);

const selectedRiskBadges = computed(() =>
  selectedRiskIds.value
    .map((id) => allClimateRisks.value.find((r) => r.id === id)?.name)
    .filter((name): name is string => !!name)
);

const selectedThemeBadges = computed(() =>
  selectedThemeIds.value
    .map((id) => allThemes.value.find((t) => t.id === id)?.name)
    .filter((name): name is string => !!name)
);

async function fetchProjects() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("projects_cordis")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (search.value) {
      const term = search.value.trim();
      query = query.or(
        `acronym.ilike.%${term}%,title.ilike.%${term}%`
      );
    }

    const { data, count, error: qError } = await query;
    if (qError) {
      if (handleAuthError(qError, router)) {
        return;
      }
      throw qError;
    }

    const baseProjects = (data ?? []) as ProjectRow[];

    // Load related themes, risks & entities for these projects
    if (baseProjects.length) {
      const projectIds = baseProjects.map((p) => p.id);

      const [
        { data: riskLinks, error: riskLinksError },
        { data: themeLinks, error: themeLinksError },
        { data: risks, error: risksError },
        { data: themes, error: themesError },
      ] = await Promise.all([
        supabase
          .from("project_risks")
          .select("project_id, risk_id")
          .in("project_id", projectIds),
        supabase
          .from("project_themes")
          .select("project_id, theme_id")
          .in("project_id", projectIds),
        supabase.from("aux_climate_risks").select("id, name"),
        supabase.from("aux_themes").select("id, name"),
      ]);

      if (riskLinksError) {
        if (handleAuthError(riskLinksError, router)) return;
        throw riskLinksError;
      }
      if (themeLinksError) {
        if (handleAuthError(themeLinksError, router)) return;
        throw themeLinksError;
      }
      if (risksError) {
        if (handleAuthError(risksError, router)) return;
        throw risksError;
      }
      if (themesError) {
        if (handleAuthError(themesError, router)) return;
        throw themesError;
      }

      const riskNameById = new Map<number, string>();
      (risks ?? []).forEach((r: any) => {
        riskNameById.set(r.id, r.name);
      });

      const themeNameById = new Map<number, string>();
      (themes ?? []).forEach((t: any) => {
        themeNameById.set(t.id, t.name);
      });

      const risksByProject: Record<string, string[]> = {};
      for (const link of riskLinks ?? []) {
        if (!link || link.risk_id == null) continue;
        const name = riskNameById.get(link.risk_id as number);
        if (!name) continue;
        const pid = String(link.project_id ?? "");
        if (!pid) continue;
        risksByProject[pid] ??= [];
        risksByProject[pid].push(name);
      }

      const themesByProject: Record<string, string[]> = {};
      for (const link of themeLinks ?? []) {
        if (!link || link.theme_id == null) continue;
        const name = themeNameById.get(link.theme_id as number);
        if (!name) continue;
        const pid = String(link.project_id ?? "");
        if (!pid) continue;
        themesByProject[pid] ??= [];
        themesByProject[pid].push(name);
      }

      // Load entities per project
      const [
        { data: entityLinks, error: entityLinksError },
        { data: entities, error: entitiesError },
      ] = await Promise.all([
        supabase
          .from("project_entities")
          .select("project_id, entity_id")
          .in("project_id", projectIds),
        supabase
          .from("entities_cordis")
          .select("id, short_name, legal_name"),
      ]);

      if (entityLinksError) {
        if (handleAuthError(entityLinksError, router)) return;
        throw entityLinksError;
      }
      if (entitiesError) {
        if (handleAuthError(entitiesError, router)) return;
        throw entitiesError;
      }

      const entityLabelById = new Map<string, string>();
      (entities ?? []).forEach((e: any) => {
        const label = e.short_name || e.legal_name || e.id;
        entityLabelById.set(e.id, label);
      });

      const entitiesByProject: Record<string, string[]> = {};
      (entityLinks ?? []).forEach((l: any) => {
        const label = entityLabelById.get(l.entity_id);
        if (!label || !l.project_id) return;
        const projectId = l.project_id;
        if (!entitiesByProject[projectId]) {
          entitiesByProject[projectId] = [];
        }
        entitiesByProject[projectId].push(label);
      });

      items.value = baseProjects.map((p) => ({
        ...p,
        risks_labels: risksByProject[p.id] ?? [],
        themes_labels: themesByProject[p.id] ?? [],
        entities_labels: entitiesByProject[p.id] ?? [],
      }));
    } else {
      items.value = [];
    }

    total.value = count ?? 0;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) {
      return;
    }
    error.value = e.message ?? "Failed to load projects.";
  } finally {
    loading.value = false;
  }
}

watch([page, search], () => {
  fetchProjects();
});

async function loadAuxLookups() {
  try {
    const [{ data: risks }, { data: themes }] = await Promise.all([
      supabase.from("aux_climate_risks").select("id, name").order("name"),
      supabase.from("aux_themes").select("id, name").order("name"),
    ]);

    allClimateRisks.value = risks ?? [];
    allThemes.value = themes ?? [];
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  fetchProjects();
  loadAuxLookups();
});

async function openEdit(row: ProjectRow) {
  loading.value = true;
  error.value = "";
  
  // Allow viewing even if not authenticated

  try {
    const [
      { data, error: qError },
      { data: riskLinks, error: riskLinksError },
      { data: themeLinks, error: themeLinksError },
    ] = await Promise.all([
      supabase
        .from("projects_cordis")
        .select("*")
        .eq("id", row.id)
        .single(),
      supabase
        .from("project_risks")
        .select("risk_id")
        .eq("project_id", row.id),
      supabase
        .from("project_themes")
        .select("theme_id")
        .eq("project_id", row.id),
    ]);

    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }
    if (riskLinksError) {
      if (handleAuthError(riskLinksError, router)) return;
      throw riskLinksError;
    }
    if (themeLinksError) {
      if (handleAuthError(themeLinksError, router)) return;
      throw themeLinksError;
    }

    originalId.value = (data as any).id;
    formData.value = { ...(data as ProjectRow) };
    selectedRiskIds.value = (riskLinks ?? []).map((r: any) => r.risk_id);
    selectedThemeIds.value = (themeLinks ?? []).map((t: any) => t.theme_id);
    isEditing.value = true;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) {
      return;
    }
    error.value = e.message ?? "Failed to load project.";
  } finally {
    loading.value = false;
  }
}

async function saveEdit() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to save changes.";
    return;
  }

  if (!originalId.value) return;

  loading.value = true;
  error.value = "";

  try {
    const payload = { ...formData.value };

    const { error: uError } = await supabase
      .from("projects_cordis")
      .update(payload)
      .eq("id", originalId.value);

    if (uError) {
      if (handleAuthError(uError, router)) return;
      throw uError;
    }

    // Update themes and risks relations
    await supabase
      .from("project_themes")
      .delete()
      .eq("project_id", originalId.value);

    if (selectedThemeIds.value.length) {
      const themeRows = selectedThemeIds.value.map((id) => ({
        project_id: originalId.value,
        theme_id: id,
      }));
      const { error: themesError } = await supabase
        .from("project_themes")
        .insert(themeRows);
      if (themesError) {
        if (handleAuthError(themesError, router)) return;
        throw themesError;
      }
    }

    await supabase
      .from("project_risks")
      .delete()
      .eq("project_id", originalId.value);

    if (selectedRiskIds.value.length) {
      const riskRows = selectedRiskIds.value.map((id) => ({
        project_id: originalId.value,
        risk_id: id,
      }));
      const { error: risksError } = await supabase
        .from("project_risks")
        .insert(riskRows);
      if (risksError) {
        if (handleAuthError(risksError, router)) return;
        throw risksError;
      }
    }

    isEditing.value = false;
    originalId.value = null;
    await fetchProjects();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) {
      return;
    }
    error.value = e.message ?? "Failed to save project.";
  } finally {
    loading.value = false;
  }
}

function cancelEdit() {
  isEditing.value = false;
  originalId.value = null;
}
</script>

<template>
  <UDashboardPanel id="admin-projects">
    <template #header>
      <UDashboardNavbar title="Projects (CORDIS)">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <UPagination
            v-model:page="page"
            :items-per-page="pageSize"
            :total="total"
            :max="7"
          />
          <p class="text-sm text-gray-500">
            Showing
            <span class="font-medium">{{ items.length }}</span>
            of
            <span class="font-medium">{{ total }}</span>
            projects
          </p>
        </div>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by acronym or title…"
          class="w-80"
          clearable
        />
      </div>

      <div class="space-y-4">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-circle"
        >
          {{ error }}
        </UAlert>

        
          <UTable
          class="max-h-[70vh] overflow-y-auto"
          sticky
            v-model:column-pinning="columnPinning"
            :data="items"
            :columns="columns"
            :loading="loading"
            empty="No projects found"
          >
            <template #actions-cell="{ row }">
              <UButton
                v-if="isAuthenticated"
                color="primary"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil-square"
                @click="openEdit(row.original)"
              >
                Edit
              </UButton>
              <UButton
                v-else
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-eye"
                @click="openEdit(row.original)"
              >
                View
              </UButton>
            </template>

            <template #themes_labels-cell="{ row }">
              <span class="text-xs">
                {{
                  (row.original.themes_labels ?? []).length
                    ? (row.original.themes_labels ?? []).join(", ")
                    : "—"
                }}
              </span>
            </template>

            <template #risks_labels-cell="{ row }">
              <span class="text-xs">
                {{
                  (row.original.risks_labels ?? []).length
                    ? (row.original.risks_labels ?? []).join(", ")
                    : "—"
                }}
              </span>
            </template>

            <template #entities_labels-cell="{ row }">
              <span class="text-xs">
                {{
                  (row.original.entities_labels ?? []).length
                    ? (row.original.entities_labels ?? []).join(", ")
                    : "—"
                }}
              </span>
            </template>
          </UTable>
      </div>

      <UModal
        v-model:open="isEditing"
        fullscreen
        :title="formData.title || formData.acronym || 'Edit project'"
      >
        <template #body>
          <div
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start"
          >
            <UFormField label="Acronym" name="acronym">
              <UInput v-model="formData.acronym" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Duration (months)" name="duration">
              <UInput v-model.number="formData.duration" type="number" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Total cost" name="total_cost">
              <UInput v-model.number="formData.total_cost" type="number" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField
              label="EC max contribution"
              name="ec_max_contribution"
            >
              <UInput
                v-model.number="formData.ec_max_contribution"
                type="number"
              />
            </UFormField>

            <UFormField label="Start date" name="start_date">
              <UInput v-model="formData.start_date" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="End date" name="end_date">
              <UInput v-model="formData.end_date" :disabled="!isAuthenticated" />
            </UFormField>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Teaser" name="teaser">
                <UTextarea v-model="formData.teaser" :rows="5" :disabled="!isAuthenticated" />
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Title" name="title">
                <UInput v-model="formData.title" :maxlength="100" class="w-full" :disabled="!isAuthenticated" />
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Keywords" name="keywords">
                <UTextarea v-model="formData.keywords" :rows="2" :disabled="!isAuthenticated" />
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Themes" name="themes_labels">
                <div class="space-y-2 border border-default rounded-lg p-4">
                  <div
                    v-if="allThemes.length === 0"
                    class="text-sm text-gray-400"
                  >
                    Loading themes...
                  </div>
                  <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    <UCheckbox
                      v-for="theme in allThemes"
                      :key="theme.id"
                      :model-value="selectedThemeIds.includes(theme.id)"
                      :label="theme.name"
                      :disabled="!isAuthenticated"
                      @update:model-value="
                        (checked) => {
                          if (checked) {
                            if (!selectedThemeIds.includes(theme.id)) {
                              selectedThemeIds.push(theme.id);
                            }
                          } else {
                            selectedThemeIds = selectedThemeIds.filter(
                              (id) => id !== theme.id
                            );
                          }
                        }
                      "
                    />
                  </div>
                  <div
                    v-if="selectedThemeIds.length === 0"
                    class="text-xs text-gray-400 mt-2"
                  >
                    No themes selected
                  </div>
                </div>
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Climate risks" name="risks_labels">
                <div class="space-y-2 border border-default rounded-lg p-4">
                  <div
                    v-if="allClimateRisks.length === 0"
                    class="text-sm text-gray-400"
                  >
                    Loading climate risks...
                  </div>
                  <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    <UCheckbox
                      v-for="risk in allClimateRisks"
                      :key="risk.id"
                      :model-value="selectedRiskIds.includes(risk.id)"
                      :label="risk.name"
                      :disabled="!isAuthenticated"
                      @update:model-value="
                        (checked) => {
                          if (checked) {
                            if (!selectedRiskIds.includes(risk.id)) {
                              selectedRiskIds.push(risk.id);
                            }
                          } else {
                            selectedRiskIds = selectedRiskIds.filter(
                              (id) => id !== risk.id
                            );
                          }
                        }
                      "
                    />
                  </div>
                  <div
                    v-if="selectedRiskIds.length === 0"
                    class="text-xs text-gray-400 mt-2"
                  >
                    No risks selected
                  </div>
                </div>
              </UFormField>
            </div>

           
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="loading"
              @click="cancelEdit"
            >
              {{ isAuthenticated ? "Cancel" : "Close" }}
            </UButton>
            <UButton
              v-if="isAuthenticated"
              color="primary"
              :loading="loading"
              icon="i-heroicons-check"
              @click="saveEdit"
            >
              Save
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>


