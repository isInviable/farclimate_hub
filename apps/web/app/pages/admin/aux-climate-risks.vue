<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import type { AuxClimateRisk } from "~/types/cordis";
import { handleAuthError } from "~/utils/authErrorHandler";

const supabase = useSupabaseClient();

const { isAuthenticated } = useAuth();
const router = useRouter();

const pageSize = 20;

const items = ref<AuxClimateRisk[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const error = ref("");

const isEditing = ref(false);
const isCreating = ref(false);
const originalId = ref<number | null>(null);
const formData = ref<AuxClimateRisk | Record<string, any>>({} as AuxClimateRisk);
const showDeleteConfirm = ref(false);

const isModalOpen = computed({
  get: () => isEditing.value || isCreating.value,
  set: (value: boolean) => {
    if (!value) {
      isEditing.value = false;
      isCreating.value = false;
    }
  },
});

const columns = [
  { id: "actions", header: "Actions" },
  { accessorKey: "name", header: "Name" },
] as any;

async function fetchRisks() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("aux_climate_risks")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (search.value) {
      const term = search.value.trim();
      query = query.ilike("name", `%${term}%`);
    }

    const { data, count, error: qError } = await query;
    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    items.value = data ?? [];
    total.value = count ?? 0;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load climate risks.";
  } finally {
    loading.value = false;
  }
}

watch([page, search], () => {
  fetchRisks();
});

onMounted(() => {
  fetchRisks();
});

function openCreate() {
  if (!isAuthenticated.value) {
    return;
  }
  formData.value = { id: 0, name: "" };
  originalId.value = null;
  isCreating.value = true;
  isEditing.value = false;
}

function openEdit(row: AuxClimateRisk) {
  originalId.value = row.id;
  formData.value = { ...row };
  isCreating.value = false;
  isEditing.value = true;
}

async function saveCreate() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to create items.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const payload = { name: formData.value.name };

    const { error: iError } = await supabase
      .from("aux_climate_risks")
      .insert(payload)
      .select()
      .single();

    if (iError) {
      if (handleAuthError(iError, router)) return;
      throw iError;
    }

    isCreating.value = false;
    originalId.value = null;
    formData.value = {} as AuxClimateRisk;
    await fetchRisks();
  } catch (e: any) {
    console.error(e);
    error.value = e.message ?? "Failed to create climate risk.";
  } finally {
    loading.value = false;
  }
}

async function saveEdit() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to edit items.";
    return;
  }

  if (originalId.value == null) return;

  loading.value = true;
  error.value = "";

  try {
    const payload = { name: formData.value.name };

    const { error: uError } = await supabase
      .from("aux_climate_risks")
      .update(payload)
      .eq("id", originalId.value);

    if (uError) {
      if (handleAuthError(uError, router)) return;
      throw uError;
    }

    isEditing.value = false;
    originalId.value = null;
    await fetchRisks();
  } catch (e: any) {
    console.error(e);
    error.value = e.message ?? "Failed to save climate risk.";
  } finally {
    loading.value = false;
  }
}

function cancelEdit() {
  isEditing.value = false;
  isCreating.value = false;
  originalId.value = null;
  formData.value = {} as AuxClimateRisk;
  showDeleteConfirm.value = false;
}

async function confirmDelete() {
  showDeleteConfirm.value = true;
}

async function deleteRisk() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to delete items.";
    return;
  }

  if (originalId.value == null) return;

  loading.value = true;
  error.value = "";

  try {
    const { error: dError } = await supabase
      .from("aux_climate_risks")
      .delete()
      .eq("id", originalId.value);

    if (dError) {
      if (handleAuthError(dError, router)) return;
      throw dError;
    }

    isEditing.value = false;
    originalId.value = null;
    showDeleteConfirm.value = false;
    formData.value = {} as AuxClimateRisk;
    await fetchRisks();
  } catch (e: any) {
    console.error(e);
    error.value = e.message ?? "Failed to delete climate risk.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="admin-aux-climate-risks">
    <template #header>
      <UDashboardNavbar title="Climate risks">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton
            v-if="isAuthenticated"
            color="primary"
            icon="i-heroicons-plus"
            :disabled="loading"
            @click="openCreate"
          >
            New
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center justify-between gap-4 mb-4">
        <h2 class="text-xl font-semibold">Climate risks</h2>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by name…"
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
            empty="No climate risks found"
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
          </UTable>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            Showing
            <span class="font-medium">{{ items.length }}</span>
            of
            <span class="font-medium">{{ total }}</span>
            climate risks
          </p>

          <UPagination
            v-model:page="page"
            :items-per-page="pageSize"
            :total="total"
            :max="7"
          />
        </div>
      </div>

      <UModal
        v-model:open="isModalOpen"
        fullscreen
        :title="isCreating ? 'New climate risk' : (formData.name || 'Edit climate risk')"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Name" name="name" required>
              <UInput v-model="formData.name" :disabled="!isAuthenticated" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center">
            <UButton
              v-if="isEditing && isAuthenticated"
              color="error"
              variant="ghost"
              :disabled="loading"
              icon="i-heroicons-trash"
              @click="confirmDelete"
            >
              Delete
            </UButton>
            <div v-else></div>
            <div class="flex gap-2">
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
                @click="isCreating ? saveCreate() : saveEdit()"
              >
                {{ isCreating ? "Create" : "Save" }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <!-- Delete confirmation modal -->
      <UModal v-model:open="showDeleteConfirm" :title="`Delete climate risk: ${formData.name || 'this item'}`">
        <template #body>
          <UAlert
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            title="Are you sure?"
            description="This action cannot be undone. This will permanently delete the climate risk."
          />
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="loading"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="loading"
              icon="i-heroicons-trash"
              @click="deleteRisk"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>


