<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["admin-auth"],
});

import type {
  ProductBase,
  ProductCustom,
  ProductWithCustomAndProjects,
  AuxProductCategory,
} from "~/types/cordis";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { handleAuthError } from "~/utils/authErrorHandler";

const supabase = useSupabaseClient();

const { isAuthenticated } = useAuth();
const router = useRouter();

const pageSize = 20;

const items = ref<ProductWithCustomAndProjects[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const error = ref("");

const isEditing = ref(false);
const isCreating = ref(false);
const currentId = ref<string | null>(null);
const uploadingImages = ref(false);
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

const baseForm = ref<ProductBase>({
  id: "",
  type: "custom",
  product_category_id: 6, // Default to platform for custom products
});

const customForm = ref<ProductCustom>({
  product_id: "",
  title: "",
  description: "",
  URL: "",
  image: [],
});

const allProjects = ref<{ id: string; label: string }[]>([]);
const selectedProjectIds = ref<string[]>([]);
const selectedFiles = ref<File[]>([]);
const existingImageUrls = ref<string[]>([]);
const allProductCategories = ref<AuxProductCategory[]>([]);

const columns = [
  { id: "actions", header: "Actions" },
  { accessorKey: "title", header: "Title" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "URL", header: "URL" },
  { accessorKey: "project_labels", header: "Projects" },
] as any;

const typeItems = [
  { label: "Custom", id: "custom" },
];

const categoryItems = computed(() =>
  allProductCategories.value.map((c) => ({ label: c.name, id: c.id }))
);

const projectItems = computed(() =>
  allProjects.value.map((p) => ({ label: p.label, id: p.id }))
);

const selectedProjectBadges = computed(() =>
  selectedProjectIds.value
    .map((id) => allProjects.value.find((p) => p.id === id)?.label)
    .filter((label): label is string => !!label)
);

const imagePreviewUrls = ref<string[]>([]);

const allImageUrls = computed(() => [
  ...existingImageUrls.value,
  ...imagePreviewUrls.value,
]);

async function uploadImages(productId: string): Promise<string[]> {
  if (!selectedFiles.value.length) return existingImageUrls.value;

  uploadingImages.value = true;
  const uploadedUrls: string[] = [];

  try {
    for (const file of selectedFiles.value) {
      // Generate unique file path: products/{productId}/{timestamp}-{filename}
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `products/${productId}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    // Clean up preview URLs after successful upload
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
    imagePreviewUrls.value = [];
    selectedFiles.value = [];

    // Combine existing URLs with newly uploaded ones
    return [...existingImageUrls.value, ...uploadedUrls];
  } catch (e: any) {
    console.error("Image upload error:", e);
    throw new Error(`Failed to upload images: ${e.message}`);
  } finally {
    uploadingImages.value = false;
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    const newFiles = Array.from(input.files);
    
    // Clean up old preview URLs
    imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
    
    // Create new preview URLs
    selectedFiles.value = newFiles;
    imagePreviewUrls.value = newFiles.map((f) => URL.createObjectURL(f));
  }
  
  // Reset input so same file can be selected again
  if (input) input.value = "";
}

function removeImage(index: number) {
  if (index < existingImageUrls.value.length) {
    // Remove from existing URLs
    existingImageUrls.value.splice(index, 1);
  } else {
    // Remove from selected files and cleanup preview URL
    const fileIndex = index - existingImageUrls.value.length;
    if (imagePreviewUrls.value[fileIndex]) {
      URL.revokeObjectURL(imagePreviewUrls.value[fileIndex]);
    }
    selectedFiles.value.splice(fileIndex, 1);
    imagePreviewUrls.value.splice(fileIndex, 1);
  }
}

async function fetchProjectsLookup() {
  try {
    const { data, error: pError } = await supabase
      .from("projects_cordis")
      .select("id, acronym, title")
      .order("id");
    if (pError) throw pError;

    const labelById = new Map<string, string>();
    (data ?? []).forEach((p: any) => {
      const label = p.acronym || p.title || p.id;
      labelById.set(p.id, label);
    });

    allProjects.value = (data ?? []).map((p: any) => ({
      id: p.id,
      label: labelById.get(p.id) || p.id,
    }));
  } catch (e) {
    console.error(e);
  }
}

async function loadProductCategories() {
  try {
    const { data, error: cError } = await supabase
      .from("aux_product_categories")
      .select("id, name")
      .order("name");
    if (cError) throw cError;
    allProductCategories.value = data ?? [];
  } catch (e) {
    console.error(e);
  }
}

async function fetchProducts() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    // First, get custom products (paginated and ordered by title) to filter/search
    let customQuery = supabase
      .from("products_custom")
      .select("product_id, title", { count: "exact" })
      .order("title", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (search.value) {
      const term = search.value.trim();
      customQuery = customQuery.ilike("title", `%${term}%`);
    }

    const { data: customData, count, error: customQueryError } = await customQuery;
    if (customQueryError) {
      if (handleAuthError(customQueryError, router)) return;
      throw customQueryError;
    }

    // Get product IDs from custom table (already paginated)
    const productIds = (customData ?? []).map((c: any) => c.product_id);

    if (productIds.length === 0) {
      // No results
      items.value = [];
      total.value = count ?? 0;
      loading.value = false;
      return;
    }

    // Now fetch base products for these IDs
    const { data: baseData, error: qError } = await supabase
      .from("products")
      .select("*")
      .eq("type", "custom")
      .in("id", productIds);

    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    const baseProducts = (baseData ?? []) as ProductBase[];

    if (baseProducts.length) {
      const ids = baseProducts.map((p) => p.id);

      const [
        { data: customRows, error: cError },
        { data: links, error: linksError },
      ] = await Promise.all([
        supabase
          .from("products_custom")
          .select("*")
          .in("product_id", ids),
        supabase
          .from("product_projects")
          .select("product_id, project_id")
          .in("product_id", ids),
      ]);

      if (cError) {
        if (handleAuthError(cError, router)) return;
        throw cError;
      }
      if (linksError) {
        if (handleAuthError(linksError, router)) return;
        throw linksError;
      }

      const customById = new Map<string, ProductCustom>();
      (customRows ?? []).forEach((c: any) => {
        customById.set(c.product_id, {
          product_id: c.product_id,
          title: c.title ?? null,
          description: c.description ?? null,
          URL: c.URL ?? null,
          image: (c.image ?? []) as string[] | null,
        });
      });

      const projectIds = Array.from(
        new Set((links ?? []).map((l: any) => l.project_id))
      );

      let projectLabelById = new Map<string, string>();

      if (projectIds.length) {
        const { data: projects, error: pError } = await supabase
          .from("projects_cordis")
          .select("id, acronym, title")
          .in("id", projectIds);
        if (pError) throw pError;

        (projects ?? []).forEach((p: any) => {
          const label = p.acronym || p.title || p.id;
          projectLabelById.set(p.id, label);
        });
      }

      const projectsByProduct: Record<string, string[]> = {};
      (links ?? []).forEach((l: any) => {
        const label = projectLabelById.get(l.project_id);
        if (!label) return;
        const pid = String(l.product_id ?? "");
        if (!pid) return;
        projectsByProduct[pid] ??= [];
        projectsByProduct[pid].push(label);
      });

      // Combine products (already sorted by title from custom query)
      // Maintain order from productIds (which came from customData ordered by title)
      items.value = productIds
        .map((id) => {
          const base = baseProducts.find((p) => p.id === id);
          if (!base) return null;
          const custom = customById.get(id);
          return {
            ...base,
            custom: custom ?? null,
            project_labels: projectsByProduct[id] ?? [],
          } as ProductWithCustomAndProjects;
        })
        .filter((item): item is ProductWithCustomAndProjects => item !== null);
    } else {
      items.value = [];
    }

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
  fetchProjectsLookup();
  loadProductCategories();
  fetchProducts();
});

onUnmounted(() => {
  // Clean up all preview URLs
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
});

function resetForms() {
  baseForm.value = {
    id: "",
    type: "custom",
    product_category_id: 6, // Default to platform for custom products
  };
  customForm.value = {
    product_id: "",
    title: "",
    description: "",
    URL: "",
    image: [],
  };
  selectedProjectIds.value = [];
  selectedFiles.value = [];
  existingImageUrls.value = [];
  // Clean up preview URLs
  imagePreviewUrls.value.forEach((url) => URL.revokeObjectURL(url));
  imagePreviewUrls.value = [];
}

function openCreate() {
  if (!isAuthenticated.value) {
    return;
  }
  resetForms();
  isCreating.value = true;
  isEditing.value = false;
}

async function saveCreate() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to create items.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // Step 1: Create base product
    const { data: productData, error: iError } = await supabase
      .from("products")
      .insert({
        type: baseForm.value.type,
        product_category_id: baseForm.value.product_category_id,
      })
      .select()
      .single();

    if (iError) {
      if (handleAuthError(iError, router)) return;
      throw iError;
    }

    const productId = productData.id;
    currentId.value = productId;

    // Step 2: Upload images
    const imageUrls = await uploadImages(productId);

    // Step 3: Insert custom row
    const payload = {
      product_id: productId,
      title: customForm.value.title || null,
      description: customForm.value.description || null,
      URL: customForm.value.URL || null,
      image: imageUrls.length ? imageUrls : null,
    };

    const { error: cError } = await supabase
      .from("products_custom")
      .insert(payload);
    if (cError) throw cError;

    // Step 4: Link projects
    if (selectedProjectIds.value.length) {
      const rows = selectedProjectIds.value.map((projectId) => ({
        product_id: productId,
        project_id: projectId,
      }));
      const { error: lError } = await supabase
        .from("product_projects")
        .insert(rows);
      if (lError) {
        if (handleAuthError(lError, router)) return;
        throw lError;
      }
    }

    isCreating.value = false;
    currentId.value = null;
    resetForms();
    await fetchProducts();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to create product.";
  } finally {
    loading.value = false;
  }
}

async function openEdit(row: ProductWithCustomAndProjects) {
  loading.value = true;
  error.value = "";

  try {
    const id = row.id;
    const [
      { data: base, error: bError },
      { data: custom, error: cError },
      { data: links, error: lError },
    ] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("products_custom").select("*").eq("product_id", id).maybeSingle(),
      supabase
        .from("product_projects")
        .select("project_id")
        .eq("product_id", id),
    ]);

    if (bError) {
      if (handleAuthError(bError, router)) return;
      throw bError;
    }
    if (cError) {
      if (handleAuthError(cError, router)) return;
      throw cError;
    }
    if (lError) {
      if (handleAuthError(lError, router)) return;
      throw lError;
    }

    baseForm.value = {
      id: base.id,
      type: base.type,
      product_category_id: base.product_category_id,
    };
    customForm.value = {
      product_id: base.id,
      title: custom?.title ?? "",
      description: custom?.description ?? "",
      URL: custom?.URL ?? "",
      image: (custom?.image ?? []) as string[],
    };
    selectedProjectIds.value = (links ?? []).map((l: any) => l.project_id);
    
    // Set existing image URLs and clear selected files
    existingImageUrls.value = (custom?.image ?? []) as string[];
    selectedFiles.value = [];

    isEditing.value = true;
    isCreating.value = false;
    currentId.value = base.id;
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

  if (!currentId.value) return;

  loading.value = true;
  error.value = "";

  try {
    // Step 1: Update base
    const { error: bError } = await supabase
      .from("products")
      .update({
        type: baseForm.value.type,
        product_category_id: baseForm.value.product_category_id,
      })
      .eq("id", currentId.value);
    if (bError) {
      if (handleAuthError(bError, router)) return;
      throw bError;
    }

    // Step 2: Upload new images
    const imageUrls = await uploadImages(currentId.value);

    // Step 3: Upsert custom (product_id is PK, so this will update existing or insert new)
    const payload = {
      product_id: currentId.value,
      title: customForm.value.title || null,
      description: customForm.value.description || null,
      URL: customForm.value.URL || null,
      image: imageUrls.length ? imageUrls : null,
    };

    const { error: cError } = await supabase
      .from("products_custom")
      .upsert(payload, { onConflict: 'product_id' });
    if (cError) throw cError;

    // Step 4: Replace links
    const { error: delError } = await supabase
      .from("product_projects")
      .delete()
      .eq("product_id", currentId.value);
    if (delError) {
      if (handleAuthError(delError, router)) return;
      throw delError;
    }

    if (selectedProjectIds.value.length) {
      const rows = selectedProjectIds.value.map((projectId) => ({
        product_id: currentId.value!,
        project_id: projectId,
      }));
      const { error: insError } = await supabase
        .from("product_projects")
        .insert(rows);
      if (insError) {
        if (handleAuthError(insError, router)) return;
        throw insError;
      }
    }

    isEditing.value = false;
    currentId.value = null;
    resetForms();
    await fetchProducts();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to save product.";
  } finally {
    loading.value = false;
  }
}

function cancelModal() {
  isEditing.value = false;
  isCreating.value = false;
  currentId.value = null;
  resetForms();
  showDeleteConfirm.value = false;
}

async function confirmDelete() {
  showDeleteConfirm.value = true;
}

async function deleteProduct() {
  if (!isAuthenticated.value) {
    error.value = "You must be logged in to delete items.";
    return;
  }

  if (!currentId.value) return;

  loading.value = true;
  error.value = "";

  try {
    // Delete images from storage - delete entire product folder
    const productFolder = `products/${currentId.value}/`;
    const { data: filesToDelete, error: listError } = await supabase.storage
      .from("images")
      .list(productFolder);

    if (!listError && filesToDelete && filesToDelete.length > 0) {
      const filePaths = filesToDelete.map((file) => `${productFolder}${file.name}`);
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove(filePaths);
      // Don't throw on storage errors, just log them
      if (storageError) {
        console.warn("Failed to delete some images from storage:", storageError);
      }
    }

    // Delete product_projects links
    const { error: linksError } = await supabase
      .from("product_projects")
      .delete()
      .eq("product_id", currentId.value);
    if (linksError) throw linksError;

    // Delete products_custom row
    const { error: customError } = await supabase
      .from("products_custom")
      .delete()
      .eq("product_id", currentId.value);
    if (customError) throw customError;

    // Delete base product
    const { error: productError } = await supabase
      .from("products")
      .delete()
      .eq("id", currentId.value);
    if (productError) throw productError;

    isEditing.value = false;
    currentId.value = null;
    showDeleteConfirm.value = false;
    resetForms();
    await fetchProducts();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to delete product.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="admin-products-custom">
    <template #header>
      <UDashboardNavbar title="Products (custom)">
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
            New product
          </UButton>
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
          placeholder="Search by title…"
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
            :ui="{
              td: 'text-neutral-dark',
            }"
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

            <template #description-cell="{ row }">
              <span class="text-xs">
                {{ row.original.custom?.description || "—" }}
              </span>
            </template>

            <template #title-cell="{ row }">
              <span class="text-xs">
                {{ row.original.custom?.title || "—" }}
              </span>
            </template>

            <template #URL-cell="{ row }">
              <span class="text-xs">
                {{ row.original.custom?.URL || "—" }}
              </span>
            </template>

            <template #project_labels-cell="{ row }">
              <span class="text-xs">
                {{
                  (row.original.project_labels ?? []).length
                    ? (row.original.project_labels ?? []).join(", ")
                    : "—"
                }}
              </span>
            </template>
          </UTable>
        </div>
      </div>

      <!-- Create/Edit modal -->
      <UModal
        v-model:open="isModalOpen"
        fullscreen
        :title="isCreating ? 'New custom product' : (customForm.title || 'Edit product')"
      >
        <template #body>
          <div
            class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start  "
          >
            <UFormField label="Title" name="title" :required="isCreating">
              <UInput v-model="customForm.title" :disabled="!isAuthenticated" />
            </UFormField>

            <UFormField label="Type" name="type" class="hidden">
              <USelectMenu
                v-model="baseForm.type"
                :items="typeItems"
                value-key="id"
                class="w-full"
                :disabled="!isAuthenticated"
              />
            </UFormField>

            <UFormField label="Category" name="product_category_id" required>
              <USelectMenu
                v-model="baseForm.product_category_id"
                :items="categoryItems"
                value-key="id"
                placeholder="Select category"
                class="w-full"
                :disabled="!isAuthenticated"
              />
            </UFormField>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Description" name="description" class="w-full">
                <MdEditor
                  :model-value="customForm.description || ''"
                  @update:model-value="(val: string) => customForm.description = val || null"
                  :editor-id="`product-description-${currentId || 'new'}`"
                  theme="light"
                  language="en-US"
                  :preview="true"
                  :toolbars="[
                    'bold',
                    'underline',
                    'italic',
                    '-',
                    'title',
                    'strikeThrough',
                    'sub',
                    'sup',
                    'quote',
                    'unorderedList',
                    'orderedList',
                    'task',
                    '-',
                    'codeRow',
                    'code',
                    'link',
                    'image',
                    'table',
                    '-',
                    'revoke',
                    'next',
                    'save',
                    '=',
                    'pageFullscreen',
                    'fullscreen',
                    'preview',
                    'catalog'
                  ]"
                  class="w-full"
                  :disabled="!isAuthenticated"
                />
              </UFormField>
            </div>

            <UFormField label="URL" name="URL">
              <UInput v-model="customForm.URL" type="url" placeholder="https://example.com" :disabled="!isAuthenticated" />
            </UFormField>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Images" name="images">
                <div class="space-y-3">
                  <div class="flex items-center gap-2">
                    <label
                      :class="[
                        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        isAuthenticated 
                          ? 'cursor-pointer bg-primary text-white hover:bg-primary/80' 
                          : 'cursor-not-allowed bg-gray-300 text-gray-500'
                      ]"
                    >
                      <UIcon name="i-heroicons-photo" class="size-4" />
                      Choose Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        class="hidden"
                        :disabled="!isAuthenticated"
                        @change="handleFileSelect"
                      />
                    </label>
                    <span
                      v-if="selectedFiles.length"
                      class="text-sm text-gray-500"
                    >
                      {{ selectedFiles.length }} file(s) selected
                    </span>
                  </div>
                  
                  <div
                    v-if="allImageUrls.length"
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                  >
                    <div
                      v-for="(url, index) in allImageUrls"
                      :key="index"
                      class="relative group"
                    >
                      <img
                        :src="url"
                        :alt="`Image ${index + 1}`"
                        class="w-full h-32 object-cover rounded-lg border border-default"
                      />
                      <UButton
                        v-if="isAuthenticated"
                        icon="i-heroicons-x-mark"
                        color="error"
                        size="xs"
                        class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="removeImage(index)"
                      />
                    </div>
                  </div>
                </div>
              </UFormField>
            </div>

            <div class="xl:col-span-3 space-y-2">
              <UFormField label="Projects" name="projects">
                <div class="space-y-2 border border-default rounded-lg p-4">
                  <div
                    v-if="allProjects.length === 0"
                    class="text-sm text-gray-400"
                  >
                    Loading projects...
                  </div>
                  <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    <UCheckbox
                      v-for="project in allProjects"
                      :key="project.id"
                      :model-value="selectedProjectIds.includes(project.id)"
                      :label="project.label"
                      :disabled="!isAuthenticated"
                      @update:model-value="
                        (checked) => {
                          if (checked) {
                            if (!selectedProjectIds.includes(project.id)) {
                              selectedProjectIds.push(project.id);
                            }
                          } else {
                            selectedProjectIds = selectedProjectIds.filter(
                              (id) => id !== project.id
                            );
                          }
                        }
                      "
                    />
                  </div>
                  <div
                    v-if="selectedProjectIds.length === 0"
                    class="text-xs text-gray-400 mt-2"
                  >
                    No projects selected
                  </div>
                </div>
              </UFormField>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-between items-center w-full">
            <UButton
              v-if="isEditing && isAuthenticated"
              color="error"
              variant="ghost"
              :disabled="loading || uploadingImages"
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
                :disabled="loading || uploadingImages"
                @click="cancelModal"
              >
                {{ isAuthenticated ? "Cancel" : "Close" }}
              </UButton>
              <UButton
                v-if="isAuthenticated"
                color="primary"
                :loading="loading || uploadingImages"
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
      <UModal v-model:open="showDeleteConfirm" :title="`Delete product: ${customForm.title || 'this product'}`">
        <template #body>
          <UAlert
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            title="Are you sure?"
            description="This action cannot be undone. This will permanently delete the product and all associated data including images."
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
              @click="deleteProduct"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>


