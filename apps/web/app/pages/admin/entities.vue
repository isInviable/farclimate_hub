<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import type { EntityRow, AuxEntityType } from "~/types/cordis";
import { handleAuthError } from "~/utils/authErrorHandler";

const supabase = useSupabaseClient();

const { isAuthenticated } = useAuth();
const router = useRouter();

const pageSize = 20;

// Stable list of allowed project_entities.type values derived from local exports:
// `dataProc/output/csv/project_entities.csv` + `dataProc/output_all/csv/project_entities.csv`
const PROJECT_ENTITY_TYPES = [
  "associatedPartner",
  "coordinator",
  "participant",
  "thirdParty",
] as const;

type ProjectEntityType = (typeof PROJECT_ENTITY_TYPES)[number];

const items = ref<EntityRow[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const error = ref("");

const allProjects = ref<{ id: string; label: string }[]>([]);
const selectedProjectIds = ref<string[]>([]);
const allEntityTypes = ref<AuxEntityType[]>([]);

const isEditing = ref(false);
const originalId = ref<string | null>(null);
const formData = ref<EntityRow | Record<string, any>>({} as EntityRow);

type ProjectEntityLinkForm = {
  project_id: string;
  type?: ProjectEntityType;
  entity_order: number | null;
  total_cost: number | null;
  ec_contribution: number | null;
  net_ec_contribution: number | null;
  sme: number | null;
  terminated: number | null;
};

const projectLinks = ref<ProjectEntityLinkForm[]>([]);
const syncingProjectSelection = ref(false);

const columns = [
  { id: "actions", header: "Actions" },
  { accessorKey: "projects_labels", header: "Projects" },
  { accessorKey: "vat_number", header: "VAT number" },
  { accessorKey: "legal_name", header: "Legal name" },
  { accessorKey: "short_name", header: "Short name" },
  { accessorKey: "address_street", header: "Street" },
  { accessorKey: "address_city", header: "City" },
  { accessorKey: "address_postal_code", header: "Postal code" },
  { accessorKey: "address_country", header: "Country" },
  { accessorKey: "address_url", header: "Website URL" },
  { accessorKey: "address_geolocation", header: "Geolocation" },
  {
    accessorKey: "organization_activity_type",
    header: "Organization activity type",
  },
  { accessorKey: "related_region_name", header: "Region name" },
  { accessorKey: "related_region_nuts_code", header: "Region NUTS code" },
  { accessorKey: "related_region_iso_code", header: "Region ISO code" },
  { accessorKey: "related_nuts_code_nuts_code", header: "Related NUTS code" },
] as any;

const totalPages = computed(() =>
  total.value ? Math.max(1, Math.ceil(total.value / pageSize)) : 1
);

const projectItems = computed(() =>
  allProjects.value.map((p) => ({ label: p.label, id: p.id }))
);

const projectEntityTypeItems = computed(() =>
  PROJECT_ENTITY_TYPES.map((t) => ({ label: t, id: t }))
);

const selectedProjectBadges = computed(() =>
  selectedProjectIds.value
    .map((id) => allProjects.value.find((p) => p.id === id)?.label)
    .filter((label): label is string => !!label)
);

const projectLabelById = computed(() => {
  const m = new Map<string, string>();
  allProjects.value.forEach((p) => m.set(p.id, p.label));
  return m;
});

function normalizeProjectLinksFromSelection() {
  const selected = new Set(selectedProjectIds.value);
  // remove links no longer selected
  projectLinks.value = projectLinks.value.filter((l) => selected.has(l.project_id));
  // add link rows for newly selected projects
  for (const projectId of selected) {
    if (!projectLinks.value.some((l) => l.project_id === projectId)) {
      projectLinks.value.push({
        project_id: projectId,
        type: undefined,
        entity_order: null,
        total_cost: null,
        ec_contribution: null,
        net_ec_contribution: null,
        sme: 0,
        terminated: 0,
      });
    }
  }
}

watch(
  selectedProjectIds,
  () => {
    if (syncingProjectSelection.value) return;
    normalizeProjectLinksFromSelection();
  },
  { deep: true }
);

function removeProject(projectId: string) {
  selectedProjectIds.value = selectedProjectIds.value.filter((id) => id !== projectId);
}

const entityTypeItems = computed(() =>
  allEntityTypes.value.map((t) => ({ label: t.name, id: t.id }))
);

async function fetchEntities() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("entities_cordis")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (search.value) {
      const term = search.value.trim();
      query = query.or(
        `legal_name.ilike.%${term}%,short_name.ilike.%${term}%`
      );
    }

    const { data, count, error: qError } = await query;

    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    const baseEntities = (data ?? []) as EntityRow[];

    if (baseEntities.length) {
      const entityIds = baseEntities.map((e) => e.id);

      const [
        { data: links, error: linksError },
        { data: projects, error: projectsError },
      ] = await Promise.all([
        supabase
          .from("project_entities")
          .select("project_id, entity_id")
          .in("entity_id", entityIds),
        supabase
          .from("projects_cordis")
          .select("id, acronym, title"),
      ]);

      if (linksError) {
        if (handleAuthError(linksError, router)) return;
        throw linksError;
      }
      if (projectsError) {
        if (handleAuthError(projectsError, router)) return;
        throw projectsError;
      }

      const projectLabelById = new Map<string, string>();
      (projects ?? []).forEach((p: any) => {
        const label = p.acronym || p.title || p.id;
        projectLabelById.set(p.id, label);
      });

      allProjects.value = (projects ?? []).map((p: any) => ({
        id: p.id,
        label: projectLabelById.get(p.id) || p.id,
      }));

      const projectsByEntity: Record<string, string[]> = {};
      (links ?? []).forEach((l: any) => {
        const label = projectLabelById.get(l.project_id);
        if (!label) return;
        const eid = String(l.entity_id ?? "");
        if (!eid) return;
        projectsByEntity[eid] ??= [];
        projectsByEntity[eid].push(label);
      });

      const entityTypeNameById = new Map<number, string>();
      allEntityTypes.value.forEach((t) => {
        entityTypeNameById.set(t.id, t.name);
      });

      items.value = baseEntities.map((e) => ({
        ...e,
        organization_activity_type: e.organization_activity_type_id
          ? entityTypeNameById.get(e.organization_activity_type_id) || null
          : null,
        projects_labels: projectsByEntity[e.id] ?? [],
      }));
    } else {
      items.value = [];
    }

    total.value = count ?? 0;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load entities.";
  } finally {
    loading.value = false;
  }
}

watch([page, search], () => {
  fetchEntities();
});

async function loadEntityTypes() {
  try {
    const { data, error: eError } = await supabase
      .from("aux_entity_types")
      .select("id, name")
      .order("name");
    if (eError) throw eError;
    allEntityTypes.value = data ?? [];
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  fetchEntities();
  loadEntityTypes();
});

async function openEdit(row: EntityRow) {
  loading.value = true;
  error.value = "";

  try {
    const [
      { data, error: qError },
      { data: links, error: linksError },
    ] = await Promise.all([
      supabase
        .from("entities_cordis")
        .select("*")
        .eq("id", row.id)
        .single(),
      supabase
        .from("project_entities")
        .select(
          "project_id,type,entity_order,total_cost,ec_contribution,net_ec_contribution,sme,terminated"
        )
        .eq("entity_id", row.id),
    ]);

    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }
    if (linksError) {
      if (handleAuthError(linksError, router)) return;
      throw linksError;
    }

    originalId.value = (data as any).id;
    formData.value = { ...(data as EntityRow) };

    syncingProjectSelection.value = true;
    projectLinks.value =
      (links ?? []).map((l: any) => ({
        project_id: l.project_id,
        type: PROJECT_ENTITY_TYPES.includes(l.type as ProjectEntityType)
          ? (l.type as ProjectEntityType)
          : undefined,
        entity_order: l.entity_order ?? null,
        total_cost: l.total_cost ?? null,
        ec_contribution: l.ec_contribution ?? null,
        net_ec_contribution: l.net_ec_contribution ?? null,
        sme: l.sme ?? 0,
        terminated: l.terminated ?? 0,
      })) ?? [];
    selectedProjectIds.value = projectLinks.value.map((l) => l.project_id);
    syncingProjectSelection.value = false;

    isEditing.value = true;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load entity.";
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
      .from("entities_cordis")
      .update(payload)
      .eq("id", originalId.value);

    if (uError) {
      if (handleAuthError(uError, router)) return;
      throw uError;
    }

    // Replace project_entities links for this entity
    // Validate required join fields (based on typical constraints for this table)
    for (const link of projectLinks.value) {
      if (!link.project_id) continue;
      if (!link.type || link.entity_order == null) {
        const label = projectLabelById.value.get(link.project_id) || link.project_id;
        throw new Error(
          `Please fill "Type" and "Order" for linked project: ${label}`
        );
      }
    }

    const { error: delLinksError } = await supabase
      .from("project_entities")
      .delete()
      .eq("entity_id", originalId.value);
    if (delLinksError) {
      if (handleAuthError(delLinksError, router)) return;
      throw delLinksError;
    }

    const linkRows = projectLinks.value
      .filter((l) => !!l.project_id)
      .map((l) => ({
        project_id: l.project_id,
        entity_id: originalId.value!,
        type: l.type ?? null,
        entity_order: l.entity_order ?? null,
        total_cost: l.total_cost ?? null,
        ec_contribution: l.ec_contribution ?? null,
        net_ec_contribution: l.net_ec_contribution ?? null,
        sme: l.sme ?? 0,
        terminated: l.terminated ?? 0,
      }));

    if (linkRows.length) {
      const { error: insLinksError } = await supabase
        .from("project_entities")
        .insert(linkRows);
      if (insLinksError) {
        if (handleAuthError(insLinksError, router)) return;
        throw insLinksError;
      }
    }

    isEditing.value = false;
    originalId.value = null;
    selectedProjectIds.value = [];
    projectLinks.value = [];
    await fetchEntities();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to save entity.";
  } finally {
    loading.value = false;
  }
}

function cancelEdit() {
  isEditing.value = false;
  originalId.value = null;
  selectedProjectIds.value = [];
  projectLinks.value = [];
}
</script>

<template>
  <UDashboardPanel id="admin-entities">
    <template #header>
      <UDashboardNavbar title="Entities (CORDIS)">
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
            entities
          </p>
        </div>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by legal or short name…"
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

        <div class="overflow-x-auto">
          <UTable
            :data="items"
            :columns="columns"
            :loading="loading"
            empty="No entities found"
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

            <template #projects_labels-cell="{ row }">
              <span class="text-xs">
                {{
                  (row.original.projects_labels ?? []).length
                    ? (row.original.projects_labels ?? []).join(", ")
                    : "—"
                }}
              </span>
            </template>
          </UTable>
        </div>
      </div>

      <UModal
        v-model:open="isEditing"
        fullscreen
        :title="formData.legal_name || formData.short_name || 'Edit entity'"
      >
        <template #body>
          <div
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start"
          >
            <UFormField label="VAT number" name="vat_number">
              <UInput v-model="formData.vat_number" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Legal name" name="legal_name">
              <UInput v-model="formData.legal_name" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Short name" name="short_name">
              <UInput v-model="formData.short_name" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Street" name="address_street">
              <UInput v-model="formData.address_street" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="City" name="address_city">
              <UInput v-model="formData.address_city" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Postal code" name="address_postal_code">
              <UInput v-model="formData.address_postal_code" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Country" name="address_country">
              <UInput v-model="formData.address_country" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Website URL" name="address_url">
              <UInput v-model="formData.address_url" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Geolocation" name="address_geolocation">
              <UInput v-model="formData.address_geolocation" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField
              label="Organization activity type"
              name="organization_activity_type_id"
            >
              <USelectMenu
                v-model="formData.organization_activity_type_id"
                :items="entityTypeItems"
                value-key="id"
                placeholder="Select organization activity type"
                class="w-full"
                :disabled="!isAuthenticated"
              />
            </UFormField>

            <UFormField label="Region name" name="related_region_name">
              <UInput v-model="formData.related_region_name" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField
              label="Region NUTS code"
              name="related_region_nuts_code"
            >
              <UInput v-model="formData.related_region_nuts_code" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Region ISO code" name="related_region_iso_code">
              <UInput v-model="formData.related_region_iso_code" class="w-full" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField
              label="Related NUTS code"
              name="related_nuts_code_nuts_code"
            >
              <UInput v-model="formData.related_nuts_code_nuts_code" :disabled="!isAuthenticated" />
            </UFormField>

            <div class="xl:col-span-2 space-y-2">
              <UFormField label="Projects" name="projects_labels">
                <div class="space-y-2">
                  <USelectMenu
                    v-model="selectedProjectIds"
                    :items="projectItems"
                    value-key="id"
                    multiple
                    placeholder="Select projects"
                    class="w-full"
                    :disabled="!isAuthenticated"
                  />
                  <div class="flex flex-wrap gap-1.5">
                    <UBadge
                      v-for="name in selectedProjectBadges"
                      :key="name"
                      size="sm"
                      color="primary"
                      variant="soft"
                    >
                      {{ name }}
                    </UBadge>
                    <span
                      v-if="!selectedProjectBadges.length"
                      class="text-xs text-gray-400"
                    >
                      No projects selected
                    </span>
                  </div>

                  <div v-if="projectLinks.length" class="space-y-3 pt-2">
                    <p class="text-xs text-gray-500">
                      Fill the project link fields for each selected project
                      (data stored in <code>project_entities</code>).
                    </p>

                    <div
                      v-for="link in projectLinks"
                      :key="link.project_id"
                      class="border border-default rounded-lg p-4 space-y-4"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="text-sm font-medium">
                          {{ projectLabelById.get(link.project_id) || link.project_id }}
                        </div>
                        <UButton
                          v-if="isAuthenticated"
                          color="error"
                          variant="ghost"
                          size="xs"
                          icon="i-heroicons-x-mark"
                          @click="removeProject(link.project_id)"
                        >
                          Remove
                        </UButton>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <UFormField label="Type" name="type" required>
                          <USelectMenu
                            v-model="link.type"
                            :items="projectEntityTypeItems"
                            value-key="id"
                            placeholder="Select type"
                            class="w-full"
                            :disabled="!isAuthenticated"
                          />
                        </UFormField>

                        <UFormField label="Order" name="entity_order" required>
                          <UInput v-model.number="link.entity_order" type="number" :disabled="!isAuthenticated" />
                        </UFormField>

                        <UFormField label="Total cost" name="total_cost">
                          <UInput v-model.number="link.total_cost" type="number" :disabled="!isAuthenticated" />
                        </UFormField>

                        <UFormField label="EC contribution" name="ec_contribution">
                          <UInput v-model.number="link.ec_contribution" type="number" :disabled="!isAuthenticated" />
                        </UFormField>

                        <UFormField
                          label="Net EC contribution"
                          name="net_ec_contribution"
                        >
                          <UInput
                            v-model.number="link.net_ec_contribution"
                            type="number"
                            :disabled="!isAuthenticated"
                          />
                        </UFormField>

                        <div class="flex items-center gap-6">
                          <UCheckbox
                            :model-value="(link.sme ?? 0) === 1"
                            label="SME"
                            :disabled="!isAuthenticated"
                            @update:model-value="
                              (checked) => (link.sme = checked ? 1 : 0)
                            "
                          />
                          <UCheckbox
                            :model-value="(link.terminated ?? 0) === 1"
                            label="Terminated"
                            :disabled="!isAuthenticated"
                            @update:model-value="
                              (checked) => (link.terminated = checked ? 1 : 0)
                            "
                          />
                        </div>
                      </div>
                    </div>
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


