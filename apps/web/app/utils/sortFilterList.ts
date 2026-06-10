export function sortByRelevance<T>(
  items: T[],
  opts: {
    isActive: (item: T) => boolean;
    isSelected: (item: T) => boolean;
    label: (item: T) => string;
  }
): T[] {
  function score(item: T): number {
    if (opts.isSelected(item)) return 3;
    if (opts.isActive(item)) return 2;
    return 1;
  }

  return [...items].sort((a, b) => {
    const scoreDiff = score(b) - score(a);
    if (scoreDiff !== 0) return scoreDiff;
    return opts.label(a).localeCompare(opts.label(b));
  });
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return fields.some((field) => (field ?? "").toLowerCase().includes(normalized));
}
