import type {
  SkillExternalLink,
  SkillItem,
  SkillLocale,
  SkillTag,
  SkillTagFilter,
} from "~/types/skills";

const MORE_MARKER = "<!-- more -->";

const fallbackImages = [
  "/img/skills/518d09f9832927f50d10de460e04c78322dfab80.png",
  "/img/skills/617a567031eeb3b22618484cc1b29b97e9a289ff.png",
  "/img/skills/21cc55fef85c1a7cd5ba2732872702e37bee9c7a.png",
  "/img/skills/0dbe392cba673e9a10906afad05672e2921668ad.png",
];

type SkillContentRow = {
  locale: SkillLocale;
  title: string;
  body_markdown: string;
};

type SkillQueryRow = {
  id: string;
  slug: string;
  header_image_path: string | null;
  published_at: string | null;
  skill_contents?: SkillContentRow[];
  skill_tag_assignments?: Array<{
    skill_tags: SkillTag | null;
  }>;
  skill_external_links?: SkillExternalLink[];
};

function normalizeLocale(locale: string): SkillLocale {
  return locale === "es" || locale === "it" ? locale : "en";
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSkillMarkdown(markdown: string) {
  const markerIndex = markdown.indexOf(MORE_MARKER);
  const summarySource = markerIndex >= 0 ? markdown.slice(0, markerIndex) : markdown.split(/\n\s*\n/)[0] ?? "";
  const body = markerIndex >= 0
    ? `${markdown.slice(0, markerIndex).trim()}\n\n${markdown.slice(markerIndex + MORE_MARKER.length).trim()}`.trim()
    : markdown.trim();

  return {
    summary: stripMarkdown(summarySource),
    body,
    hasMoreMarker: markerIndex >= 0,
  };
}

function formatDate(value: string | null, locale: SkillLocale): string {
  if (!value) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function estimateReadTime(
  markdown: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));

  return t("skills.readTime", { minutes });
}

function tagLabel(tag: SkillTag, locale: SkillLocale): string {
  if (locale === "es") return tag.name_es || tag.name_en;
  if (locale === "it") return tag.name_it || tag.name_en;
  return tag.name_en;
}

function skillImage(supabase: ReturnType<typeof useSupabaseClient>, path: string | null, index = 0): string {
  if (!path) return fallbackImages[index % fallbackImages.length] ?? fallbackImages[0];

  return supabase.storage.from("skills").getPublicUrl(path).data.publicUrl;
}

function pickSkillContent(contents: SkillContentRow[] | undefined, locale: SkillLocale) {
  if (!contents?.length) return null;

  return contents.find((item) => item.locale === locale)
    ?? contents.find((item) => item.locale === "en")
    ?? null;
}

function toSkillItem(
  row: SkillQueryRow,
  locale: SkillLocale,
  supabase: ReturnType<typeof useSupabaseClient>,
  t: (key: string, params?: Record<string, unknown>) => string,
  index = 0,
): SkillItem | null {
  const content = pickSkillContent(row.skill_contents, locale);
  if (!content) return null;

  const { summary, body } = splitSkillMarkdown(content.body_markdown);
  const tags = (row.skill_tag_assignments ?? [])
    .map((assignment) => assignment.skill_tags)
    .filter((tag): tag is SkillTag => Boolean(tag))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tagLabel(tag, locale),
    }));

  return {
    id: row.id,
    slug: row.slug,
    locale,
    title: content.title,
    description: summary,
    bodyMarkdown: body,
    image: skillImage(supabase, row.header_image_path, index),
    date: formatDate(row.published_at, locale),
    readTime: estimateReadTime(body, t),
    url: `/skills/${row.slug}`,
    tags,
    links: (row.skill_external_links ?? []).sort((a, b) => a.sort_order - b.sort_order),
    publishedAt: row.published_at,
  };
}

export function useSkillsContent() {
  const supabase = useSupabaseClient();
  const { locale, t } = useI18n();

  const currentLocale = computed(() => normalizeLocale(locale.value));

  async function fetchPublishedSkills() {
    const activeLocale = currentLocale.value;

    const { data, error } = await supabase
      .from("skills")
      .select(`
        id,
        slug,
        header_image_path,
        published_at,
        skill_contents(locale, title, body_markdown),
        skill_tag_assignments(skill_tags(id, slug, name_en, name_es, name_it, sort_order)),
        skill_external_links(id, label, url, sort_order)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return ((data ?? []) as SkillQueryRow[])
      .map((row, index) => toSkillItem(row, activeLocale, supabase, t, index))
      .filter((item): item is SkillItem => Boolean(item));
  }

  async function fetchPublishedSkillBySlug(slug: string) {
    const activeLocale = currentLocale.value;

    const { data, error } = await supabase
      .from("skills")
      .select(`
        id,
        slug,
        header_image_path,
        published_at,
        skill_contents(locale, title, body_markdown),
        skill_tag_assignments(skill_tags(id, slug, name_en, name_es, name_it, sort_order)),
        skill_external_links(id, label, url, sort_order)
      `)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return toSkillItem(data as SkillQueryRow, activeLocale, supabase, t);
  }

  function buildTagFilters(skills: SkillItem[]): SkillTagFilter[] {
    const counts = new Map<string, SkillTagFilter>();

    for (const skill of skills) {
      for (const tag of skill.tags) {
        const current = counts.get(tag.slug);
        counts.set(tag.slug, {
          label: tag.label,
          slug: tag.slug,
          count: (current?.count ?? 0) + 1,
        });
      }
    }

    return Array.from(counts.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  return {
    currentLocale,
    fetchPublishedSkills,
    fetchPublishedSkillBySlug,
    buildTagFilters,
  };
}
