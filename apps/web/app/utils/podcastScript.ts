/** Keywords that indicate bracketed/parenthetical text is a production note, not narration. */
const PRODUCTION_NOTE_RE =
  /\b(music|pause|intro|outro|segment|part|section|fade|sfx|sound|beat|transition|break|silence|jingle|stinger)\b/i;

function looksLikeProductionNote(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (PRODUCTION_NOTE_RE.test(trimmed)) return true;
  return /^(?:segment|part|section)\s+\d+/i.test(trimmed);
}

/**
 * Converts common LLM stage-direction patterns into `#` comment lines so they stay
 * visible in the editor but are easy to strip before text-to-speech.
 */
export function normalizePodcastScriptComments(script: string): string {
  const out: string[] = [];

  for (const rawLine of script.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    if (/^#/.test(trimmed) || /^\/\//.test(trimmed)) {
      out.push(rawLine);
      continue;
    }

    const parenOnly = trimmed.match(/^\(([^)]+)\)\s*$/);
    if (parenOnly && looksLikeProductionNote(parenOnly[1])) {
      out.push(`# ${parenOnly[1].trim()}`);
      continue;
    }

    const bracketOnly = trimmed.match(/^\[([^\]]+)\]\s*$/);
    if (bracketOnly && looksLikeProductionNote(bracketOnly[1])) {
      out.push(`# ${bracketOnly[1].trim()}`);
      continue;
    }

    const divider = trimmed.match(/^[-=*]{3,}\s*(.+?)\s*[-=*]{3,}$/);
    if (divider && looksLikeProductionNote(divider[1])) {
      out.push(`# ${divider[1].trim()}`);
      continue;
    }

    const inlineEnd = trimmed.match(/^(.+?)\s*[\(\[]([^)\]]+)[\)\]]\s*$/);
    if (inlineEnd && looksLikeProductionNote(inlineEnd[2])) {
      out.push(inlineEnd[1].trim());
      out.push(`# ${inlineEnd[2].trim()}`);
      continue;
    }

    out.push(rawLine);
  }

  return out.join("\n");
}

/**
 * Returns only the narration text that should be sent to text-to-speech.
 * Comment lines and production-note markers are removed.
 */
export function stripPodcastScriptDirections(script: string): string {
  const lines: string[] = [];

  for (const rawLine of script.split("\n")) {
    let line = rawLine;
    const trimmed = line.trim();

    if (!trimmed) continue;
    if (/^#/.test(trimmed) || /^\/\//.test(trimmed)) continue;
    if (/^[-=*]{3,}/.test(trimmed) && looksLikeProductionNote(trimmed)) continue;
    if (/^\[(?:segment|intro|outro|part|section)\b/i.test(trimmed) && trimmed.endsWith("]")) {
      continue;
    }

    line = line.replace(/\([^)]+\)/g, (match) =>
      looksLikeProductionNote(match.slice(1, -1)) ? "" : match
    );
    line = line.replace(/\[[^\]]+\]/g, (match) =>
      looksLikeProductionNote(match.slice(1, -1)) ? "" : match
    );

    const cleaned = line.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
    if (cleaned) lines.push(cleaned);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
