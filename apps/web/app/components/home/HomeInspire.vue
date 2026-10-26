<script setup lang="ts">
defineProps<{
  inspire: {
    slides: {
      image: string
      imageAlt: string
      title: string
      card: {
        kicker: string
        body: string
        tone: 'blue' | 'yellow' | 'aqua'
        image: string
        imageAlt: string
      }
    }[]
  }
}>()

const toneClass = {
  blue: 'bg-adapt-blue text-adapt-sand',
  yellow: 'bg-adapt-yellow text-black',
  aqua: 'bg-adapt-aqua text-black',
} as const

const active = ref(0)

const arrow = {
  color: 'neutral',
  variant: 'link',
  ui: { base: 'p-0 text-adapt-sand hover:text-adapt-sand', leadingIcon: 'size-10 lg:size-20' },
} as const
</script>

<template>
  <section class="group/inspire overflow-hidden">
    <UCarousel
      v-slot="{ item, index }"
      class="relative"
      :items="inspire.slides"
      loop
      fade
      :duration="45"
      :autoplay="{ delay: 7000, stopOnInteraction: false }"
      dots
      arrows
      prev-icon="i-heroicons-chevron-left"
      next-icon="i-heroicons-chevron-right"
      :prev="arrow"
      :next="arrow"
      :ui="{
        item: 'basis-full min-w-0 ps-0',
        container: 'ms-0',
        prev: 'start-0! opacity-100 transition-all duration-200 ease-in-out lg:-start-5.5! lg:opacity-0 lg:group-hover/inspire:start-5.5! lg:group-hover/inspire:opacity-100',
        next: 'end-0! opacity-100 transition-all duration-200 ease-in-out lg:-end-5.5! lg:opacity-0 lg:group-hover/inspire:end-5.5! lg:group-hover/inspire:opacity-100',
        dots: 'absolute inset-x-0 bottom-[5%] justify-center gap-2.5 lg:bottom-5',
        dot: 'size-[7px] bg-white/25 data-[state=active]:bg-white',
      }"
      @select="active = $event"
    >
      <div class="relative flex min-h-[1018px] items-center">
        <img
          :src="item.image"
          :alt="item.imageAlt"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          class="relative mx-auto flex w-full flex-col px-6 text-right [text-shadow:0_1px_3px_rgb(0_0_0/0.3)] lg:w-[73%] lg:px-0"
          :class="{ 'inspire-enter': active === index }"
        >
          <h2 class="max-w-[700px] font-adapt-keyword text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-black uppercase">
            {{ item.title }}
          </h2>
          <div
            class="mt-[30px] ml-auto box-border w-full max-w-[340px] px-10 pt-10 pb-8"
            :class="toneClass[item.card.tone]"
          >
            <h3 class="mb-[15px] font-adapt-title text-[clamp(1.25rem,3.2vw,2.1875rem)] tracking-[2px] text-black uppercase">
              {{ item.card.kicker }}
            </h3>
            <p class="mb-2.5 font-adapt-body text-base leading-[1.6]">{{ item.card.body }}</p>
            <img
              :src="item.card.image"
              :alt="item.card.imageAlt"
              class="mt-4 ml-auto block h-auto w-full max-w-40"
            />
          </div>
        </div>
      </div>
    </UCarousel>
  </section>
</template>

<style scoped>
.inspire-enter {
  animation: inspire-fade-bottom 0.7s ease-in-out 0.9s both;
}

@keyframes inspire-fade-bottom {
  from {
    opacity: 0;
    transform: translateY(10%);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .inspire-enter {
    animation: none;
  }
}
</style>
