/** Relative calendar label for explorer UI (matches prior projects dashboard copy). */
export function formatExplorerRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffInDays === 0) return "today";
  if (diffInDays === 1) return "yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
}
