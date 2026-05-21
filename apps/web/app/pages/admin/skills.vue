<script setup lang="ts">
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type {
  SkillContent,
  SkillExternalLink,
  SkillLocale,
  SkillStatus,
  SkillTag,
} from "~/types/skills";
import { splitSkillMarkdown } from "~/composables/useSkillsContent";
import { handleAuthError } from "~/utils/authErrorHandler";

definePageMeta({
  layout: "admin",
  middleware: ["admin-auth"],
});

type AdminSkillRow = {
  id: string;
  slug: string;
  header_image_path: string | null;
  status: SkillStatus;
  published_at: string | null;
  skill_contents?: SkillContent[];
  skill_tag_assignments?: Array<{ skill_tags: SkillTag | null }>;
  skill_external_links?: SkillExternalLink[];
};

const locales: Array<{ code: SkillLocale; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
];

const statusItems = [
  { label: "Draft", id: "draft" },
  { label: "Published", id: "published" },
];

const supabase = useSupabaseClient();
const router = useRouter();
const { isAuthenticated } = useAuth();

const pageSize = 20;
const items = ref<AdminSkillRow[]>([]);
const tags = ref<SkillTag[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref("");
const loading = ref(false);
const uploadingImage = ref(false);
const error = ref("");
const modalError = ref("");
const isCreating = ref(false);
const isEditing = ref(false);
const showDeleteConfirm = ref(false);
const currentId = ref<string | null>(null);
const selectedHeaderImage = ref<File | null>(null);

const tagForm = ref({
  id: "",
  slug: "",
  name_en: "",
  name_es: "",
  name_it: "",
  sort_order: 0,
});

const skillForm = ref({
  slug: "",
  status: "draft" as SkillStatus,
  header_image_path: null as string | null,
  selectedTagIds: [] as string[],
  links: [] as SkillExternalLink[],
  contents: locales.reduce(
    (acc, locale) => {
      acc[locale.code] = {
        locale: locale.code,
        title: "",
        body_markdown: "",
      };
      return acc;
    },
    {} as Record<SkillLocale, SkillContent>,
  ),
});

const isModalOpen = computed({
  get: () => isCreating.value || isEditing.value,
  set: (value: boolean) => {
    if (!value) cancelSkillModal();
  },
});

const tagItems = computed(() =>
  tags.value.map((tag) => ({
    label: `${tag.name_en} (${tag.slug})`,
    id: tag.id,
  })),
);

const columns = [
  { id: "actions", header: "Actions" },
  { accessorKey: "slug", header: "Slug" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "published_at", header: "Published" },
] as any;

function resetSkillForm() {
  skillForm.value = {
    slug: "",
    status: "draft",
    header_image_path: null,
    selectedTagIds: [],
    links: [],
    contents: locales.reduce(
      (acc, locale) => {
        acc[locale.code] = {
          locale: locale.code,
          title: "",
          body_markdown: "",
        };
        return acc;
      },
      {} as Record<SkillLocale, SkillContent>,
    ),
  };
  selectedHeaderImage.value = null;
}

function publicHeaderImageUrl(path: string | null) {
  if (!path) return "";
  return supabase.storage.from("skills").getPublicUrl(path).data.publicUrl;
}

function skillTitle(row: AdminSkillRow) {
  return (
    row.skill_contents?.find((content) => content.locale === "en")?.title ??
    row.slug
  );
}

async function fetchTags() {
  const { data, error: tagError } = await supabase
    .from("skill_tags")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (tagError) throw tagError;
  tags.value = data ?? [];
}

async function fetchSkills() {
  loading.value = true;
  error.value = "";

  try {
    const from = (page.value - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("skills")
      .select(
        `
        id,
        slug,
        header_image_path,
        status,
        published_at,
        skill_contents(id, skill_id, locale, title, body_markdown),
        skill_tag_assignments(skill_tags(id, slug, name_en, name_es, name_it, sort_order)),
        skill_external_links(id, skill_id, label, url, sort_order)
      `,
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (search.value.trim()) {
      query = query.ilike("slug", `%${search.value.trim()}%`);
    }

    const { data, count, error: qError } = await query;
    if (qError) {
      if (handleAuthError(qError, router)) return;
      throw qError;
    }

    items.value = (data ?? []) as AdminSkillRow[];
    total.value = count ?? 0;
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to load skills.";
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchTags(), fetchSkills()]);
}

watch([page, search], () => {
  fetchSkills();
});

onMounted(() => {
  refreshAll();
});

function openCreateSkill() {
  if (!isAuthenticated.value) return;
  resetSkillForm();
  modalError.value = "";
  currentId.value = null;
  isCreating.value = true;
  isEditing.value = false;
}

function openEditSkill(row: AdminSkillRow) {
  resetSkillForm();
  modalError.value = "";
  currentId.value = row.id;
  skillForm.value.slug = row.slug;
  skillForm.value.status = row.status;
  skillForm.value.header_image_path = row.header_image_path;
  skillForm.value.selectedTagIds = (row.skill_tag_assignments ?? [])
    .map((assignment) => assignment.skill_tags?.id)
    .filter((id): id is string => Boolean(id));
  skillForm.value.links = (row.skill_external_links ?? [])
    .map((link) => ({ ...link }))
    .sort((a, b) => a.sort_order - b.sort_order);

  for (const content of row.skill_contents ?? []) {
    if (
      content.locale === "en" ||
      content.locale === "es" ||
      content.locale === "it"
    ) {
      skillForm.value.contents[content.locale] = { ...content };
    }
  }

  isCreating.value = false;
  isEditing.value = true;
}

function cancelSkillModal() {
  isCreating.value = false;
  isEditing.value = false;
  showDeleteConfirm.value = false;
  modalError.value = "";
  currentId.value = null;
  resetSkillForm();
}

function hasOptionalLocaleContent(locale: SkillLocale) {
  const content = skillForm.value.contents[locale];
  return Boolean(content.title.trim() || content.body_markdown.trim());
}

type SkillContentPayload = {
  skill_id: string;
  locale: SkillLocale;
  title: string;
  body_markdown: string;
};

function buildContentPayloads(skillId: string): SkillContentPayload[] {
  const english = skillForm.value.contents.en;
  const payloads: SkillContentPayload[] = [
    {
      skill_id: skillId,
      locale: "en",
      title: english.title.trim(),
      body_markdown: english.body_markdown,
    },
  ];

  for (const locale of ["es", "it"] as const) {
    if (!hasOptionalLocaleContent(locale)) continue;

    const content = skillForm.value.contents[locale];
    payloads.push({
      skill_id: skillId,
      locale,
      title: content.title.trim() || english.title.trim(),
      body_markdown: content.body_markdown.trim() || english.body_markdown,
    });
  }

  return payloads;
}

async function uploadHeaderImage(skillId: string) {
  if (!selectedHeaderImage.value) return skillForm.value.header_image_path;

  uploadingImage.value = true;
  const file = selectedHeaderImage.value;
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 9);
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${skillId}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("skills")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;
    return path;
  } finally {
    uploadingImage.value = false;
  }
}

function addExternalLink() {
  skillForm.value.links.push({
    label: "",
    url: "",
    sort_order: skillForm.value.links.length + 1,
  });
}

function removeExternalLink(index: number) {
  skillForm.value.links.splice(index, 1);
}

function insertMoreMarker(locale: SkillLocale) {
  const content = skillForm.value.contents[locale];
  if (content.body_markdown.includes("<!-- more -->")) return;
  content.body_markdown = `${content.body_markdown.trim()}\n\n<!-- more -->\n\n`;
}

function validateSkillForm() {
  if (!skillForm.value.slug.trim()) return "Slug is required.";
  if (!skillForm.value.selectedTagIds.length)
    return "Select at least one tag before saving.";

  const english = skillForm.value.contents.en;
  if (!english.title.trim()) return "English title is required.";
  if (!english.body_markdown.trim())
    return "English markdown content is required.";

  for (const link of skillForm.value.links) {
    if (!link.label.trim() || !/^https?:\/\//i.test(link.url)) {
      return "Each external link needs a label and an http(s) URL.";
    }
  }

  return "";
}

async function saveSkill() {
  if (!isAuthenticated.value) {
    modalError.value = "You must be logged in to save skills.";
    return;
  }

  const validationError = validateSkillForm();
  if (validationError) {
    modalError.value = validationError;
    return;
  }

  loading.value = true;
  error.value = "";
  modalError.value = "";

  try {
    const publishedAt =
      skillForm.value.status === "published" ? new Date().toISOString() : null;
    const payload = {
      slug: skillForm.value.slug.trim(),
      status: skillForm.value.status,
      published_at: publishedAt,
      header_image_path: skillForm.value.header_image_path,
    };

    const { data: savedSkill, error: skillError } = currentId.value
      ? await supabase
          .from("skills")
          .update(payload)
          .eq("id", currentId.value)
          .select("id")
          .single()
      : await supabase.from("skills").insert(payload).select("id").single();

    if (skillError) {
      if (handleAuthError(skillError, router)) return;
      throw skillError;
    }

    const skillId = savedSkill.id as string;
    const headerImagePath = await uploadHeaderImage(skillId);

    if (headerImagePath !== skillForm.value.header_image_path) {
      const { error: imagePathError } = await supabase
        .from("skills")
        .update({ header_image_path: headerImagePath })
        .eq("id", skillId);
      if (imagePathError) throw imagePathError;
    }

    const contentPayloads = buildContentPayloads(skillId);

    const { error: contentError } = await supabase
      .from("skill_contents")
      .upsert(contentPayloads, { onConflict: "skill_id,locale" });
    if (contentError) throw contentError;

    const savedOptionalLocales = new Set(
      contentPayloads
        .map((payload) => payload.locale)
        .filter((locale) => locale === "es" || locale === "it"),
    );
    const optionalLocalesToClear = (["es", "it"] as const).filter(
      (locale) => !savedOptionalLocales.has(locale),
    );

    if (optionalLocalesToClear.length) {
      const { error: clearOptionalContentError } = await supabase
        .from("skill_contents")
        .delete()
        .eq("skill_id", skillId)
        .in("locale", optionalLocalesToClear);
      if (clearOptionalContentError) throw clearOptionalContentError;
    }

    const { error: clearTagsError } = await supabase
      .from("skill_tag_assignments")
      .delete()
      .eq("skill_id", skillId);
    if (clearTagsError) throw clearTagsError;

    const { error: tagError } = await supabase
      .from("skill_tag_assignments")
      .insert(
        skillForm.value.selectedTagIds.map((tagId) => ({
          skill_id: skillId,
          tag_id: tagId,
        })),
      );
    if (tagError) throw tagError;

    const { error: clearLinksError } = await supabase
      .from("skill_external_links")
      .delete()
      .eq("skill_id", skillId);
    if (clearLinksError) throw clearLinksError;

    const linkPayloads = skillForm.value.links
      .filter((link) => link.label.trim() && link.url.trim())
      .map((link, index) => ({
        skill_id: skillId,
        label: link.label.trim(),
        url: link.url.trim(),
        sort_order: index + 1,
      }));

    if (linkPayloads.length) {
      const { error: linkError } = await supabase
        .from("skill_external_links")
        .insert(linkPayloads);
      if (linkError) throw linkError;
    }

    cancelSkillModal();
    await fetchSkills();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    modalError.value = e.message ?? "Failed to save skill.";
  } finally {
    loading.value = false;
  }
}

async function deleteSkill() {
  if (!currentId.value) return;

  loading.value = true;
  error.value = "";

  try {
    const { error: deleteError } = await supabase
      .from("skills")
      .delete()
      .eq("id", currentId.value);
    if (deleteError) throw deleteError;

    cancelSkillModal();
    await fetchSkills();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to delete skill.";
  } finally {
    loading.value = false;
  }
}

function openTag(tag?: SkillTag) {
  tagForm.value = tag
    ? { ...tag }
    : {
        id: "",
        slug: "",
        name_en: "",
        name_es: "",
        name_it: "",
        sort_order: tags.value.length + 1,
      };
}

function validateTagForm() {
  if (!tagForm.value.slug.trim()) return "Tag slug is required.";
  if (!tagForm.value.name_en.trim()) return "English tag name is required.";
  if (!tagForm.value.name_es.trim()) return "Spanish tag name is required.";
  if (!tagForm.value.name_it.trim()) return "Italian tag name is required.";
  return "";
}

async function saveTag() {
  const validationError = validateTagForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const payload = {
      slug: tagForm.value.slug.trim(),
      name_en: tagForm.value.name_en.trim(),
      name_es: tagForm.value.name_es.trim(),
      name_it: tagForm.value.name_it.trim(),
      sort_order: Number(tagForm.value.sort_order) || 0,
    };

    const { error: tagError } = tagForm.value.id
      ? await supabase
          .from("skill_tags")
          .update(payload)
          .eq("id", tagForm.value.id)
      : await supabase.from("skill_tags").insert(payload);
    if (tagError) throw tagError;

    openTag();
    await fetchTags();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to save tag.";
  } finally {
    loading.value = false;
  }
}

async function deleteTag(tag: SkillTag) {
  loading.value = true;
  error.value = "";

  try {
    const { error: tagError } = await supabase
      .from("skill_tags")
      .delete()
      .eq("id", tag.id);
    if (tagError) throw tagError;
    await fetchTags();
  } catch (e: any) {
    console.error(e);
    if (handleAuthError(e, router)) return;
    error.value = e.message ?? "Failed to delete tag.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="admin-skills">
    <template #header>
      <UDashboardNavbar title="Skills">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="isAuthenticated"
            size="lg"
            color="primary"
            icon="i-heroicons-plus"
            :disabled="loading"
            @click="openCreateSkill"
          >
            Add new skill
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-circle"
          :description="error"
        />

        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-semibold">Skills</h2>
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass-20-solid"
            placeholder="Search by slug..."
            class="w-80"
            clearable
          />
        </div>

        <UTable
          :data="items"
          :columns="columns"
          :loading="loading"
          empty="No skills found"
        >
          <template #slug-cell="{ row }">
            <div>
              <div class="font-medium">{{ skillTitle(row.original) }}</div>
              <div class="text-xs text-gray-500">{{ row.original.slug }}</div>
            </div>
          </template>
          <template #status-cell="{ row }">
            <UBadge
              :color="
                row.original.status === 'published' ? 'success' : 'neutral'
              "
              variant="soft"
            >
              {{ row.original.status }}
            </UBadge>
          </template>
          <template #actions-cell="{ row }">
            <UButton
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-heroicons-pencil-square"
              @click="openEditSkill(row.original)"
            >
              Edit
            </UButton>
          </template>
        </UTable>

        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            Showing <span class="font-medium">{{ items.length }}</span> of
            <span class="font-medium">{{ total }}</span> skills
          </p>
          <UPagination
            v-model:page="page"
            :items-per-page="pageSize"
            :total="total"
            :max="7"
          />
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold">Tags</h2>
              <UButton
                size="sm"
                variant="soft"
                icon="i-heroicons-plus"
                @click="openTag()"
              >
                New tag
              </UButton>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="space-y-2">
              <div
                v-for="tag in tags"
                :key="tag.id"
                class="flex items-center justify-between rounded-lg border border-default p-3"
              >
                <div>
                  <div class="font-medium">{{ tag.name_en }}</div>
                  <div class="text-xs text-gray-500">
                    {{ tag.name_es }} / {{ tag.name_it }} · {{ tag.slug }}
                  </div>
                </div>
                <div class="flex gap-1">
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    @click="openTag(tag)"
                  />
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="deleteTag(tag)"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-3 bg-neutral-100 p-4 rounded-lg">
              <h2 class="text-base  font-semibold">Add New Tag</h2>
              <UFormField label="Slug" required>
                <UInput
                  v-model="tagForm.slug"
                  placeholder="nature-based-solutions"
                />
              </UFormField>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <UFormField label="English" required>
                  <UInput v-model="tagForm.name_en" />
                </UFormField>
                <UFormField label="Spanish" required>
                  <UInput v-model="tagForm.name_es" />
                </UFormField>
                <UFormField label="Italian" required>
                  <UInput v-model="tagForm.name_it" />
                </UFormField>
              </div>
              <UFormField label="Sort order">
                <UInput v-model="tagForm.sort_order" type="number" />
              </UFormField>
              <div class="flex justify-end">
                <UButton
                  color="primary"
                  :loading="loading"
                  icon="i-heroicons-check"
                  @click="saveTag"
                >
                  {{ tagForm.id ? "Save tag" : "Add tag" }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <UModal
        v-model:open="isModalOpen"
        fullscreen
        :title="isCreating ? 'New skill' : `Edit skill: ${skillForm.slug}`"
        :ui="{
          body: 'bg-neutral-100 ',
        }"
      >
        <template #body>
          <div class="space-y-8">
            <UAlert
              v-if="modalError"
              color="error"
              variant="soft"
              icon="i-heroicons-exclamation-circle"
              :description="modalError"
            />

            <UCard variant="subtle" class="max-w-7xl mx-auto">
              <template #header>
                <h3 class="text-lg font-semibold">Common skill fields</h3>
              </template>

              <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <UFormField label="Slug" required>
                  <UInput
                    v-model="skillForm.slug"
                    placeholder="good-practices-for-climate-adaptation"
                  />
                </UFormField>

                <UFormField label="Status" required>
                  <USelectMenu
                    v-model="skillForm.status"
                    :items="statusItems"
                    value-key="id"
                  />
                </UFormField>

                <UFormField label="Tags" required class="lg:col-span-2">
                  <USelectMenu
                    v-model="skillForm.selectedTagIds"
                    :items="tagItems"
                    value-key="id"
                    multiple
                    class="w-full"
                    placeholder="Select tags"
                  />
                </UFormField>

                <UFormField label="Header image" class="lg:col-span-2">
                  <div class="space-y-3">
                    <img
                      v-if="!selectedHeaderImage && skillForm.header_image_path"
                      :src="publicHeaderImageUrl(skillForm.header_image_path)"
                      alt=""
                      class="h-40 w-64 rounded-lg border border-default object-cover"
                    />

                    <UFileUpload
                      v-model="selectedHeaderImage"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      icon="i-lucide-image"
                      label="Drop header image here"
                      description="JPEG, PNG, WebP or GIF. Max 10 MB."
                      variant="area"
                      layout="list"
                      class="w-full max-w-lg"
                      :ui="{ base: 'min-h-32' }"
                      :disabled="loading || uploadingImage"
                    />
                  </div>
                </UFormField>

                <div class="space-y-3 lg:col-span-2">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium">External links</h4>
                    <UButton
                      size="sm"
                      variant="soft"
                      icon="i-heroicons-plus"
                      @click="addExternalLink"
                    >
                      Add link
                    </UButton>
                  </div>

                  <div
                    v-for="(link, index) in skillForm.links"
                    :key="index"
                    class="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr_auto]"
                  >
                    <UInput v-model="link.label" placeholder="Label" />
                    <UInput
                      v-model="link.url"
                      type="url"
                      placeholder="https://example.com"
                    />
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      @click="removeExternalLink(index)"
                    />
                  </div>
                </div>
              </div>
            </UCard>

            <UCard
              v-for="locale in locales"
              :key="locale.code"
              class="max-w-7xl mx-auto"
              variant="subtle"
            >
              <template #header>
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-semibold">
                      {{ locale.label }} content
                    </h3>
                    <p v-if="locale.code !== 'en'" class="text-sm text-muted">
                      Optional. Leave empty to use the English version on the
                      public site.
                    </p>
                  </div>
                  <UButton
                    size="sm"
                    variant="soft"
                    @click="insertMoreMarker(locale.code)"
                  >
                    Insert &lt;!-- more --&gt;
                  </UButton>
                </div>
              </template>

              <div class="space-y-4">
                <UFormField
                  label="Title"
                  :required="locale.code === 'en'"
                  class="w-full"
                >
                  <UInput
                    v-model="skillForm.contents[locale.code].title"
                    class="w-full"
                  />
                </UFormField>

                <UAlert
                  color="neutral"
                  variant="soft"
                  icon="i-heroicons-information-circle"
                  title="Summary marker"
                  :description="`Text before <!-- more --> becomes the ${locale.label} card summary. Current summary: ${splitSkillMarkdown(skillForm.contents[locale.code].body_markdown).summary || 'empty'}`"
                />

                <MdEditor
                  v-model="skillForm.contents[locale.code].body_markdown"
                  :editor-id="`skill-editor-${locale.code}-${currentId || 'new'}`"
                  theme="light"
                  language="en-US"
                  :preview="true"
                  class="w-full"
                />
              </div>
            </UCard>
          </div>
        </template>

        <template #footer>
          <div class="flex w-full items-center justify-between">
            <UButton
              v-if="isEditing"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              :disabled="loading"
              @click="showDeleteConfirm = true"
            >
              Delete
            </UButton>
            <div v-else />

            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                :disabled="loading"
                @click="cancelSkillModal"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-heroicons-check"
                :loading="loading || uploadingImage"
                @click="saveSkill"
              >
                {{ isCreating ? "Create" : "Save" }}
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <UModal v-model:open="showDeleteConfirm" title="Delete skill">
        <template #body>
          <UAlert
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            title="Are you sure?"
            description="This deletes the skill, localized content, tag assignments, and external links."
          />
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-heroicons-trash"
              :loading="loading"
              @click="deleteSkill"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
