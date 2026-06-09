export function getCordisProjectUrl(cordisId: string) {
  return `https://cordis.europa.eu/project/id/${cordisId}`;
}

export function getCordisOrganizationUrl(cordisId: string) {
  return `https://cordis.europa.eu/organization/id/${cordisId}`;
}

export function parseCordisKeywords(keywords: string | null | undefined): string[] {
  if (!keywords?.trim()) return [];
  return keywords
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean);
}
