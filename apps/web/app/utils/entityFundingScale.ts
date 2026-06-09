/** Log₁₀(€ + 1) — maps funding to a slider-friendly range that includes €0. */
export function fundingToLog(value: number): number {
  return Math.log10(value + 1);
}

/** Inverse of {@link fundingToLog}. */
export function fundingFromLog(value: number): number {
  return 10 ** value - 1;
}
