// umap-js is CommonJS and its entry only re-exports `UMAP`, so
// `import { cosine } from 'umap-js'` throws under Nitro's native ESM.
import { UMAP } from 'umap-js'

export { UMAP }

/** Same formula as the `cosine` that umap-js does not expose on its entry. */
export function cosine(x: number[], y: number[]): number {
  let result = 0
  let normX = 0
  let normY = 0
  for (let i = 0; i < x.length; i++) {
    const xi = x[i] ?? 0
    const yi = y[i] ?? 0
    result += xi * yi
    normX += xi ** 2
    normY += yi ** 2
  }
  if (normX === 0 && normY === 0) return 0
  if (normX === 0 || normY === 0) return 1
  return 1 - result / Math.sqrt(normX * normY)
}

/** Deterministic PRNG so UMAP layouts are identical on every load. */
export const mulberry32 = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export type DeterministicUmapOptions = {
  nPoints: number
  seed?: number
  nNeighbors?: number
  minDist?: number
}

/** Fit UMAP with cosine distance and a seeded random initializer. */
export function runDeterministicUmap(
  rows: number[][],
  options: DeterministicUmapOptions
): [number, number][] {
  const n = options.nPoints
  if (n <= 0) return []
  if (n === 1) return [[0, 0]]

  const nNeighbors = Math.min(n - 1, Math.max(2, options.nNeighbors ?? 12))

  const umap = new UMAP({
    nComponents: 2,
    nNeighbors,
    minDist: options.minDist ?? 0.4,
    distanceFn: cosine,
    random: mulberry32(options.seed ?? 42),
  })

  const nEpochs = umap.initializeFit(rows)
  const steps = Math.min(nEpochs, 300)
  for (let i = 0; i < steps; i++) umap.step()

  const embedding = umap.getEmbedding() as [number, number][]
  if (embedding.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) {
    throw new Error('non-finite embedding')
  }
  return embedding
}
