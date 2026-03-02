<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

import type { ProductRow } from "~/types/cordis";
import { handleAuthError } from "~/utils/authErrorHandler";

const supabase = useSupabaseClient();

const { isAuthenticated } = useAuth();
const router = useRouter();

const pageSize = 20;

const items = ref<ProductRow[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const error = ref("");

const isEditing = ref(false);
const originalId = ref<string | null>(null);
const formData = ref<ProductRow | Record<string, any>>({} as ProductRow);

const columns = [
  { id: "actions", header: "Actions" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "details_authors", header: "Authors" },
  { accessorKey: "details_journal_number", header: "Journal number" },
  { accessorKey: "details_journal_title", header: "Journal title" },
  { accessorKey: "details_published_pages", header: "Published pages" },
  { accessorKey: "details_published_year", header: "Published year" },
  { accessorKey: "details_publisher", header: "Publisher" },
  { accessorKey: "type_code", header: "Type code" },
  { accessorKey: "type_title", header: "Type title" },
  { accessorKey: "product_type_id", header: "Product type ID" },
  { accessorKey: "product_type_name", header: "Product type name" },
  { accessorKey: "sub_type_code", header: "Subtype code" },
  { accessorKey: "sub_type_title", header: "Subtype title" },
  { accessorKey: "doi", header: "DOI" },
  { accessorKey: "issn", header: "ISSN" },
] as any;

async function fetchProducts() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("products_cordis")
      .select("*", { count: "exact" })
      .order("product_id", { ascending: true })
      .range(from, to);

    if (search.value) {
      const term = search.value.trim();
      query = query.or(
        `title.ilike.%${term}%,type_title.ilike.%${term}%`
      );
    }

    const { data, count, error: qError } = await query;
    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    // Map product_id to id for backward compatibility with ProductRow interface
    items.value = (data ?? []).map((item: any) => ({
      ...item,
      id: item.product_id,
    }));
    total.value = count ?? 0;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load products.";
  } finally {
    loading.value = false;
  }
}

watch([page, search], () => {
  fetchProducts();
});

onMounted(() => {
  fetchProducts();
});

async function openEdit(row: ProductRow) {
  loading.value = true;
  error.value = "";

  try {
    const { data, error: qError } = await supabase
      .from("products_cordis")
      .select("*")
      .eq("product_id", row.id)
      .single();

    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    originalId.value = data.product_id;
    formData.value = { 
      ...(data as any),
      id: data.product_id, // Map product_id to id for ProductRow interface
    } as ProductRow;
    isEditing.value = true;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load product.";
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
      .from("products_cordis")
      .update(payload)
      .eq("product_id", originalId.value);

    if (uError) {
      if (handleAuthError(uError, router)) return;
      throw uError;
    }

    isEditing.value = false;
    originalId.value = null;
    await fetchProducts();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to save product.";
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
  <UDashboardPanel id="admin-products">
    <template #header>
      <UDashboardNavbar title="Products (CORDIS)">
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
            products
          </p>
        </div>
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          placeholder="Search by title or type…"
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
            empty="No products found"
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
      </div>

      <UModal
        v-model:open="isEditing"
        fullscreen
        :title="formData.title || 'Edit product'"
      >
        <template #body>
          <div
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start max-w-4xl"
          >
            <UFormField label="Product ID" name="product_id">
              <UInput v-model="formData.product_id" disabled />
            </UFormField>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Title" name="title">
                <UTextarea v-model="formData.title" :rows="2" class="w-full" :disabled="!isAuthenticated" />
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Authors" name="details_authors">
                <UTextarea v-model="formData.details_authors" :rows="2" class="w-full" :disabled="!isAuthenticated" />
              </UFormField>
            </div>

            <UFormField
              label="Journal number"
              name="details_journal_number"
            >
              <UInput v-model="formData.details_journal_number" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Journal title" name="details_journal_title">
              <UInput v-model="formData.details_journal_title" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField
              label="Published pages"
              name="details_published_pages"
            >
              <UInput v-model="formData.details_published_pages" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Published year" name="details_published_year">
              <UInput v-model="formData.details_published_year" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Publisher" name="details_publisher">
              <UInput v-model="formData.details_publisher" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Type code" name="type_code">
              <UInput v-model="formData.type_code" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Type title" name="type_title">
              <UInput v-model="formData.type_title" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Product type ID" name="product_type_id">
              <UInput
                v-model.number="formData.product_type_id"
                type="number"
                :disabled="!isAuthenticated"
              />
            </UFormField>

            <UFormField label="Product type name" name="product_type_name">
              <UInput v-model="formData.product_type_name" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Subtype code" name="sub_type_code">
              <UInput v-model="formData.sub_type_code" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Subtype title" name="sub_type_title">
              <UInput v-model="formData.sub_type_title" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="DOI" name="doi">
              <UInput v-model="formData.doi" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="ISSN" name="issn">
              <UInput v-model="formData.issn" :disabled="!isAuthenticated" />
            </UFormField>
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


