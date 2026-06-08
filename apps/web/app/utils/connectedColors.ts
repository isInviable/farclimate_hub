// Connected Action — shared palette mapping.
// The new editorial design uses a 5-colour categorical set (blue/ochre/rust/
// moss/violet). The project only ships `trust-blue` as an exact match, so the
// other four are mapped to the closest existing brand tokens (see main.css).
// Centralised here so the map / network / umap views share one source of truth.

export const CA_INK = "#100007"; // neutral-darkest
export const CA_PAPER = "#fffbf8"; // neutral-lightest
export const CA_SOFT = "#f4efe8"; // ~ warm-neutral-100
export const CA_MUTE = "#70666a"; // neutral-dark
export const CA_BLUE = "#1e63a2"; // trust-blue-darkest

// Categorical palette — brand approximations of the prototype's hues.
export const CA_CAT = {
  blue: "#1e63a2", // trust-blue-darkest
  moss: "#9e9e14", // grounded-green-dark
  ochre: "#dabd03", // resilient-yellow-darkest
  rust: "#ff0777", // community-pink-dark
  violet: "#70666a", // neutral-dark
} as const;

export const CA_CAT_LIST: string[] = [
  CA_CAT.blue,
  CA_CAT.moss,
  CA_CAT.ochre,
  CA_CAT.rust,
  CA_CAT.violet,
];

// Entity-type key → colour (mirrors prototype semantics).
export const CA_ENTITY_TYPE_COLOR: Record<string, string> = {
  research: CA_CAT.blue,
  public: CA_CAT.moss,
  ngo: CA_CAT.rust,
  business: CA_CAT.ochre,
  network: CA_CAT.violet,
};

// Stepped blue ramp for choropleths (existing trust-blue scale, light → deep).
export const CA_BLUE_RAMP = [
  "#e8eff6", // trust-blue-lightest
  "#d2e0ec", // trust-blue-lighter
  "#bbd0e3", // trust-blue-light
  "#78a1c7", // trust-blue
  "#4b82b5", // trust-blue-dark
  "#1e63a2", // trust-blue-darkest
  "#13497c", // hand-darkened step
];

// Map a count to a ramp colour (matches the prototype's stops).
export function caChoroplethColor(count: number | null | undefined): string {
  if (count == null) return "#e7e2db";
  const stops = [0, 5, 10, 20, 40, 80, 9999];
  for (let i = 0; i < stops.length; i++) {
    if (count <= stops[i]!) return CA_BLUE_RAMP[Math.min(i, CA_BLUE_RAMP.length - 1)]!;
  }
  return CA_BLUE_RAMP[CA_BLUE_RAMP.length - 1]!;
}

// Deterministic ordinal colour for an arbitrary set of category labels,
// cycling through the brand categorical palette.
export function caOrdinalColor(domain: string[]): (label: string) => string {
  const lookup = new Map<string, string>();
  domain.forEach((label, i) => {
    lookup.set(label, CA_CAT_LIST[i % CA_CAT_LIST.length]!);
  });
  return (label: string) => lookup.get(label) ?? CA_MUTE;
}
