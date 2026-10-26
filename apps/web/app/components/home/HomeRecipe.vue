<script setup lang="ts">
defineProps<{
  recipe: {
    kicker: string
    title: string
    lead: string
    count: string
    body: string
    image: string
    imageAlt: string
    groups: { title: string, items: string[] }[]
    cta: { label: string, to: string, image: string }
  }
}>()

type Side = 'start' | 'end'

interface DesktopSlot {
  box: { x: number, y: number, w: number }
  list: { side: Side, line: number, y: number, minH: number, w: number, pad: number, pt: number }
  links: [number, number, number, number][]
}

interface MobileSlot {
  box: { x: number, w: number }
  list: { side: Side, line: number, pad: number, pt: number, pb: number }
}

// Desktop coordinates live on a 1024 × 701 canvas, mobile ones on a 345-wide column.
const desktopSlots: DesktopSlot[] = [
  {
    box: { x: 136, y: 82, w: 237 },
    list: { side: 'end', line: 350, y: 136, minH: 116, w: 260, pad: 27, pt: 22 },
    links: [[350, 183, 405, 183]],
  },
  {
    box: { x: 588, y: 38, w: 237 },
    list: { side: 'start', line: 736, y: 123, minH: 175, w: 270, pad: 21, pt: 22 },
    links: [[662, 265, 736, 265]],
  },
  {
    box: { x: 142, y: 370, w: 236 },
    list: { side: 'end', line: 348, y: 424, minH: 159, w: 300, pad: 15, pt: 21 },
    links: [[348, 472, 440, 472], [440, 387, 440, 472]],
  },
  {
    box: { x: 700, y: 378, w: 236 },
    list: { side: 'start', line: 628, y: 420, minH: 235, w: 330, pad: 22, pt: 38 },
    links: [[628, 420, 700, 420], [558, 525, 628, 525], [558, 398, 558, 525]],
  },
]

const mobileSlots: MobileSlot[] = [
  { box: { x: 52, w: 187 }, list: { side: 'end', line: 180, pad: 17, pt: 12, pb: 26 } },
  { box: { x: 29, w: 186 }, list: { side: 'start', line: 146, pad: 19, pt: 13, pb: 16 } },
  { box: { x: 86, w: 185 }, list: { side: 'end', line: 248, pad: 12, pt: 17, pb: 17 } },
  { box: { x: 104, w: 186 }, list: { side: 'start', line: 121, pad: 17, pt: 13, pb: 28 } },
]

const u = (n: number) => `calc(var(--u) * ${n})`

function desktopListStyle({ side, line, y, minH, w, pad, pt }: DesktopSlot['list']) {
  return {
    left: u(side === 'end' ? line - w : line),
    top: u(y),
    width: u(w),
    minHeight: u(minH),
    paddingTop: u(pt),
    [side === 'end' ? 'paddingRight' : 'paddingLeft']: u(pad),
  }
}

function linkStyle([x1, y1, x2, y2]: [number, number, number, number]) {
  return {
    left: u(Math.min(x1, x2)),
    top: u(Math.min(y1, y2)),
    width: x1 === x2 ? undefined : u(Math.abs(x2 - x1)),
    height: y1 === y2 ? undefined : u(Math.abs(y2 - y1)),
  }
}

function mobileListStyle({ side, line, pad, pt, pb }: MobileSlot['list']) {
  return side === 'end'
    ? { width: u(line), paddingRight: u(pad), paddingTop: u(pt), paddingBottom: u(pb) }
    : { marginLeft: u(line), paddingLeft: u(pad), paddingTop: u(pt), paddingBottom: u(pb) }
}
</script>

<template>
  <section class="overflow-hidden bg-adapt-aqua pt-9 pb-10 text-adapt-ink lg:pb-6">
    <div class="mx-auto w-4/5 lg:w-full lg:max-w-[67.5rem] lg:px-5">
      <p class="pl-8 font-adapt-body text-base">{{ recipe.kicker }}</p>
      <h2 class="pt-1 font-adapt-heavy text-[2.9375rem] leading-[0.8] tracking-[1px] text-adapt-sand uppercase">
        {{ recipe.title }}
      </h2>
      <div class="mt-4 flex flex-col lg:flex-row lg:items-start">
        <div class="w-48 lg:w-[22.25rem]">
          <p class="w-[5.75rem] text-right font-adapt-body text-base lg:w-[19.625rem]">{{ recipe.lead }}</p>
          <p class="-mt-0.5 pt-2.5 pr-2 text-right font-adapt-heavy text-[5.3125rem] leading-[0.8] tracking-[1px] text-adapt-orange">
            {{ recipe.count }}
          </p>
        </div>
        <p class="mt-8 max-w-[17rem] font-adapt-body text-base leading-[1.3] lg:mt-6 lg:ml-4 lg:max-w-[19.625rem]">
          {{ recipe.body }}
        </p>
      </div>
    </div>

    <div class="mx-auto mt-2 hidden w-[90%] grid-cols-[minmax(0,73.6%)_minmax(0,1fr)] lg:grid">
      <div class="recipe-canvas @container relative aspect-[1024/701]">
        <div
          class="absolute overflow-hidden"
          :style="{ left: u(345), top: u(128), width: u(350), height: u(240) }"
        >
          <img
            :src="recipe.image"
            :alt="recipe.imageAlt"
            class="absolute max-w-none"
            :style="{ left: u(-46), top: u(-58), width: u(474) }"
          />
        </div>
        <template v-for="(group, index) in recipe.groups.slice(0, desktopSlots.length)" :key="group.title">
          <p
            class="recipe-box absolute"
            :style="{ left: u(desktopSlots[index]!.box.x), top: u(desktopSlots[index]!.box.y), width: u(desktopSlots[index]!.box.w) }"
          >
            {{ group.title }}
          </p>
          <ul
            class="recipe-list absolute"
            :class="desktopSlots[index]!.list.side === 'end' ? 'recipe-list--end' : 'recipe-list--start'"
            :style="desktopListStyle(desktopSlots[index]!.list)"
          >
            <li v-for="item in group.items" :key="item">{{ item }}</li>
          </ul>
          <span
            v-for="(link, linkIndex) in desktopSlots[index]!.links"
            :key="linkIndex"
            class="recipe-link absolute"
            :style="linkStyle(link)"
            aria-hidden="true"
          />
        </template>
      </div>
      <StoneCta
        class="mt-28 justify-self-end"
        appearance="sand"
        layout="stack"
        :label="recipe.cta.label"
        :to="recipe.cta.to"
        :image="recipe.cta.image"
      />
    </div>

    <div class="recipe-canvas recipe-canvas--mobile @container mx-auto mt-10 w-4/5 max-w-[30rem] lg:hidden">
      <div v-for="(group, index) in recipe.groups.slice(0, mobileSlots.length)" :key="group.title">
        <p
          class="recipe-box"
          :style="{ marginLeft: u(mobileSlots[index]!.box.x), width: u(mobileSlots[index]!.box.w) }"
        >
          {{ group.title }}
        </p>
        <ul
          class="recipe-list"
          :class="mobileSlots[index]!.list.side === 'end' ? 'recipe-list--end' : 'recipe-list--start'"
          :style="mobileListStyle(mobileSlots[index]!.list)"
        >
          <li v-for="item in group.items" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div class="relative overflow-hidden" :style="{ height: u(200) }">
        <img
          :src="recipe.image"
          :alt="recipe.imageAlt"
          class="absolute w-full max-w-none"
          :style="{ top: u(-35) }"
        />
      </div>
      <StoneCta
        class="mt-8"
        appearance="sand"
        layout="stack"
        :label="recipe.cta.label"
        :to="recipe.cta.to"
        :image="recipe.cta.image"
      />
    </div>
  </section>
</template>

<style scoped>
.recipe-canvas {
  --u: calc(100cqw / 1024);
  --line: max(1.5px, calc(var(--u) * 2));
}

.recipe-canvas--mobile {
  --u: calc(100cqw / 345);
}

.recipe-box {
  border: var(--line) solid #fff;
  padding: calc(var(--u) * 9) calc(var(--u) * 12);
  font-family: var(--font-adapt-keyword);
  font-size: calc(var(--u) * 28);
  line-height: 1.1;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  text-wrap: balance;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 16);
  font-family: var(--font-adapt-body);
  font-size: max(10px, calc(var(--u) * 15.5));
  line-height: 1.3;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.recipe-list--end {
  border-right: var(--line) solid #fff;
  text-align: right;
}

.recipe-list--start {
  border-left: var(--line) solid #fff;
}

.recipe-link {
  width: var(--line);
  height: var(--line);
  background: #fff;
}

.recipe-canvas--mobile .recipe-box {
  padding: calc(var(--u) * 8) calc(var(--u) * 10);
  font-size: calc(var(--u) * 18.5);
}

.recipe-canvas--mobile .recipe-list {
  gap: calc(var(--u) * 11);
  font-size: max(10px, calc(var(--u) * 11.5));
}
</style>
