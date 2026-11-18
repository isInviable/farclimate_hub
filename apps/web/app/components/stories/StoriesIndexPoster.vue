<script setup lang="ts">
type StoryIndexCard = {
  slug: string;
  name: string;
  line: string;
};

defineProps<{
  wordmark: string[];
  subtitle: string;
  paragraphs: string[];
  image: string;
  cards: StoryIndexCard[];
}>();

const portraits = [
  {
    src: "/img/adaptarium/stories/historias-3.png",
    nameClass: "text-adapt-orange",
  },
  {
    src: "/img/adaptarium/stories/historias-1.png",
    nameClass: "text-adapt-sea",
  },
  {
    src: "/img/adaptarium/stories/historia-2.png",
    nameClass: "text-adapt-yellow",
  },
  {
    src: "/img/adaptarium/stories/historias-3.png",
    nameClass: "text-adapt-orange",
  },
];
</script>

<template>
  <div class="bg-adapt-paper">
    <section class="relative bg-[#0040C6] flex flex-col items-center">
      <div class="grid grid-cols-6 container  mx-auto bg-no-repeat" :style="`background-image: url(${image}); background-size:contain; background-position: top-left;`">
        <div class="col-span-3">
        
        </div>
        <div class="relative col-span-2 flex items-center py-10">
          
          <div
            class="flex flex-col justify-center gap-6 px-8 text-white"
          >
            <h1
              class="font-adapt-heavy text-5xl leading-[0.9] text-adapt-yellow"
            >
              <span v-for="line in wordmark" :key="line" class="block">{{
                line
              }}</span>
            </h1>
            <p class="font-adapt-title text-4xl leading-none">
              {{ subtitle }}
            </p>
            <div
              class="flex flex-col gap-4 font-adapt-body text-base leading-relaxed ml-16"
            >
              <p v-for="paragraph in paragraphs" :key="paragraph">
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 bg-adapt-foam lg:grid-cols-4">
      <NuxtLinkLocale
        v-for="(card, index) in cards"
        :key="card.slug"
        :to="`/stories/${card.slug}`"
        class="relative flex min-h-140 flex-col gap-3 overflow-hidden px-8 pt-11"
      >
        <img
          :src="portraits[index]?.src"
          alt=""
          class="absolute inset-0 h-full w-full object-cover"
        />
        <h2
          class="relative font-adapt-heavy text-4xl leading-tight"
          :class="portraits[index]?.nameClass"
        >
          {{ card.name }}
        </h2>
        <p
          class="relative font-adapt-keyword text-2xl uppercase leading-tight tracking-wide text-adapt-paper"
        >
          {{ card.line }}
        </p>
      </NuxtLinkLocale>
    </section>
  </div>
</template>

<style scoped>

</style>