export type SkillLocale = "en" | "es" | "it";

export type SkillStatus = "draft" | "published";

export interface SkillTag {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  name_it: string;
  sort_order: number;
}

export interface SkillExternalLink {
  id?: string;
  skill_id?: string;
  label: string;
  url: string;
  sort_order: number;
}

export interface SkillContent {
  id?: string;
  skill_id?: string;
  locale: SkillLocale;
  title: string;
  body_markdown: string;
}

export interface SkillRow {
  id: string;
  slug: string;
  header_image_path: string | null;
  status: SkillStatus;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SkillItem {
  id: string;
  slug: string;
  locale: SkillLocale;
  title: string;
  description: string;
  bodyMarkdown: string;
  image: string;
  date: string;
  readTime: string;
  url: string;
  tags: Array<{
    id: string;
    slug: string;
    label: string;
  }>;
  links: SkillExternalLink[];
  publishedAt: string | null;
}

export interface SkillTagFilter {
  label: string;
  slug: string;
  count: number;
}
