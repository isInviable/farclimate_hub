<template>
  <svg :width="W" :height="H" :viewBox="`0 0 ${W} ${H}`" class="block">
    <!-- dashboard: ranked bars -->
    <template v-if="id === 'dashboard'">
      <rect
        v-for="(b, i) in dashboardBars"
        :key="`b${i}`"
        :x="12"
        :y="10 + i * 12"
        :width="b"
        :height="7"
        :fill="i < 2 ? accent : '#c9d8e6'"
      />
    </template>

    <!-- map: scattered dots -->
    <template v-else-if="id === 'map'">
      <circle
        v-for="(p, i) in mapDots"
        :key="`m${i}`"
        :cx="p.x"
        :cy="p.y"
        :r="p.r"
        :fill="accent"
        :opacity="p.o"
      />
    </template>

    <!-- network: bipartite -->
    <template v-else-if="id === 'network'">
      <line
        v-for="(l, i) in networkLines"
        :key="`l${i}`"
        :x1="l.x1"
        :y1="l.y1"
        :x2="l.x2"
        :y2="l.y2"
        stroke="#70666a"
        stroke-width="0.5"
        opacity="0.4"
      />
      <rect
        v-for="(t, i) in networkTop"
        :key="`nt${i}`"
        :x="t[0] - 4"
        :y="t[1] - 5"
        :width="8"
        :height="10"
        :rx="4"
        :fill="accent"
      />
      <circle
        v-for="(b, i) in networkBot"
        :key="`nb${i}`"
        :cx="b[0]"
        :cy="b[1]"
        :r="2.4"
        :fill="catList[i % catList.length]"
      />
    </template>

    <!-- umap: clusters -->
    <template v-else>
      <circle
        v-for="(c, i) in umapDots"
        :key="`u${i}`"
        :cx="c.x"
        :cy="c.y"
        :r="c.r"
        :fill="accent"
        :opacity="c.o"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { CA_CAT_LIST } from "~/utils/connectedColors";

interface Props {
  id: string;
  accent: string;
}

defineProps<Props>();

const W = 132;
const H = 84;
const catList = CA_CAT_LIST;

// Deterministic PRNG so previews render identically.
function makeRng(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 48271) % 2147483647) / 2147483647);
}

const dashboardBars = [62, 48, 40, 34, 26, 20];

const mapDots = computed(() => {
  const r = makeRng(7);
  return Array.from({ length: 46 }, () => ({
    x: 18 + r() * (W - 36),
    y: 12 + r() * (H - 24),
    r: r() * 2 + 1.4,
    o: 0.55 + r() * 0.4,
  }));
});

const networkTop = Array.from({ length: 6 }, (_, i) => [16 + i * 20, 16] as [number, number]);
const networkBot = Array.from({ length: 8 }, (_, i) => [12 + i * 15.5, 68] as [number, number]);
const networkLines = computed(() => {
  const r = makeRng(11);
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  networkTop.forEach((t) => {
    networkBot.forEach((b) => {
      if (r() > 0.55) lines.push({ x1: t[0], y1: t[1], x2: b[0], y2: b[1] });
    });
  });
  return lines;
});

const umapDots = computed(() => {
  const r = makeRng(23);
  const clusters = [
    [34, 38],
    [88, 30],
    [100, 60],
    [60, 64],
  ];
  const out: { x: number; y: number; r: number; o: number }[] = [];
  clusters.forEach((c) => {
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2;
      const rad = r() * 14;
      out.push({
        x: c[0]! + Math.cos(a) * rad,
        y: c[1]! + Math.sin(a) * rad,
        r: r() * 5 + 2,
        o: 0.35 + r() * 0.5,
      });
    }
  });
  return out;
});
</script>
