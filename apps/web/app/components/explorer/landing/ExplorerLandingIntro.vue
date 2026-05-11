<template>
  <div class="text-center mb-10 md:mb-12">
    <h1 class="font-display font-bold text-neutral-darkest text-4xl md:text-5xl mb-4">
      {{ $t("explorer.index.heroTitle") }}
    </h1>
  </div>

  <section class="explorer-editorial-panel p-6 md:p-8 mb-10 md:mb-12">
    <h2 class="font-display font-semibold text-xl md:text-2xl text-neutral-darkest mb-4">
      {{ $t("explorer.index.aboutTitle") }}
    </h2>
    <div class="typo-body text-neutral-dark max-w-none">
      <p class="leading-relaxed">
        {{ $t("explorer.index.aboutBody") }}
      </p>
    </div>
  </section>
</template>
