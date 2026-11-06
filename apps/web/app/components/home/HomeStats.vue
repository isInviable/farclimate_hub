<script setup lang="ts">
defineProps<{
  stats: {
    image: string;
    imageAlt: string;
    items: {
      prefix?: string;
      value: string;
      label: string;
      highlight?: boolean;
    }[];
  };
}>();

const firstWord = (label: string) => label.split(" ")[0];
const restWords = (label: string) => label.split(" ").slice(1).join(" ");
</script>

<template>
  <section class=" bg-adapt-ink">
    <div class="max-w-9xl mx-auto">
      <div
        class="bg-cover bg-no-repeat bg-(image:--stats-image) bg-top w-full"
        :style="{ '--stats-image': `url('${stats.image}')` }"
        :aria-label="stats.imageAlt"
      >
        <div class="pl-20 py-20">
          <div
            class=" bg-adapt-blue px-12 py-12 text-right text-white w-full md:w-[50vw] xl:w-[30vw] max-w-xl"
          >
            <div
              v-for="item in stats.items"
              :key="item.label"
              class="mb-4 last:mb-0 lg:mb-[1.4vw]"
            >
              <div
                class="font-adapt-heavy text-4xl leading-[0.9] tracking-tight text-adapt-yellow uppercase text-right flex flex-col items-end"
              >
                <span v-if="item.prefix" class=" text-6xl max-w-[4ch] mr-0">{{
                  item.prefix
                }}</span>
                <span class="inline-block">
                {{ item.value }}
                </span>
              </div>
              <p
                class="mt-2 font-adapt-keyword text-3xl leading-[1.1] tracking-[0.12em] text-adapt-navy uppercase"
              >
                <span class="block" :class="{ 'text-white': item.highlight }">{{
                  firstWord(item.label)
                }}</span>
                <span class="ml-auto block max-w-[9em]">{{
                  restWords(item.label)
                }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
