const SECTOR_PILL_KEYS: Record<string, string> = {
  forestry: "forestry",
  agriculture: "agriculture",
  fishery: "fishery",
  fisheries: "fishery",
};

/** Localized free-text term for explorer `sector` deep links (landing, home cards). */
export function localizedSectorSearchTerm(
  sectorKey: string,
  t: (key: string) => string,
): string {
  if (sectorKey.toLowerCase() === "all") return "all";
  const pillKey = SECTOR_PILL_KEYS[sectorKey.toLowerCase()] ?? sectorKey;
  return t(`pills.${pillKey}`);
}
