export default defineAppConfig({
  ui: {
    colors: {
      primary: "trust-blue",
      neutral: "warm-neutral",
    },
    // Global UButton theme: https://ui.nuxt.com/docs/getting-started/theme#app-config
    // Generated defaults: apps/web/.nuxt/ui/button.ts
    button: {
      variants: {
        variant: {
          // Editorial outline: hairline ink border, mono uppercase, square corners
          editorial:
            "rounded-none border border-neutral-darkest bg-transparent text-neutral-darkest hover:bg-neutral-darkest/5 font-mono uppercase tracking-[0.1em]",
          // Editorial filled: ink fill, paper text
          'editorial-solid':
            "rounded-none border border-neutral-darkest bg-neutral-darkest text-neutral-lightest hover:bg-neutral-darker font-mono uppercase tracking-[0.1em]",
        },
      },
      compoundVariants: [
        {
          variant: "outline",
          // Border follows label/icon color (currentColor) for every `color` prop
          class: "border border-current",
        },
      ],
    },
    // Editorial input: square corners, hairline ink ring, mono type.
    // Use as: <UInput variant="editorial" />
    input: {
      variants: {
        variant: {
          editorial:
            "rounded-none ring-1 ring-inset ring-neutral-darkest bg-neutral-lightest text-neutral-darkest placeholder:text-neutral-dark font-mono text-xs focus-visible:ring-2 focus-visible:ring-neutral-darkest",
        },
      },
    },
    // Editorial textarea — same language as the editorial input.
    textarea: {
      variants: {
        variant: {
          editorial:
            "rounded-none ring-1 ring-inset ring-neutral-darkest bg-neutral-lightest text-neutral-darkest placeholder:text-neutral-dark font-mono text-xs focus-visible:ring-2 focus-visible:ring-neutral-darkest",
        },
      },
    },
    // Editorial radio group: square ink-bordered segmented control with mono
    // labels (no rounded corners, no soft fill). Use color="neutral".
    // Use as: <URadioGroup variant="editorial" color="neutral" />
    radioGroup: {
      variants: {
        variant: {
          editorial: {
            item: "border border-neutral-darkest bg-neutral-lightest",
            label:
              "font-mono uppercase text-2xs font-bold tracking-[0.14em] text-neutral-darkest",
            description: "font-mono text-2xs text-neutral-dark",
            base:
              "rounded-full ring-1 ring-inset ring-neutral-darkest data-[state=checked]:ring-neutral-darkest",
          },
        },
      },
      compoundVariants: [
        {
          variant: "editorial",
          orientation: "horizontal",
          class: {
            fieldset: "gap-0 -space-x-px",
            item: "first-of-type:rounded-none last-of-type:rounded-none",
          },
        },
        {
          variant: "editorial",
          orientation: "vertical",
          class: {
            fieldset: "gap-0 -space-y-px",
            item: "first-of-type:rounded-none last-of-type:rounded-none",
          },
        },
        {
          variant: "editorial",
          color: "neutral",
          class: {
            item: "has-data-[state=checked]:bg-neutral-darkest/5 has-data-[state=checked]:z-[1]",
            indicator: "bg-neutral-darkest",
          },
        },
        // Padding for the segmented cells (mirror table-variant sizing).
        { variant: "editorial", size: "xs", class: { item: "p-2" } },
        { variant: "editorial", size: "sm", class: { item: "p-2.5" } },
        { variant: "editorial", size: "md", class: { item: "p-3" } },
        { variant: "editorial", size: "lg", class: { item: "p-3.5" } },
        { variant: "editorial", size: "xl", class: { item: "p-4" } },
      ],
    },
    badge: {
      slots: {
        base: "font-semibold ", // or font-medium, font-normal, …
      },
      variants: {
        variant: {
          // Editorial outline badge: hairline ink border, mono uppercase, square corners
          editorial:
            "rounded-none border border-neutral-darkest bg-transparent text-neutral-darkest font-mono uppercase tracking-[0.14em]",
        },
      },
      compoundVariants: [
        {
          variant: "solid",
          color: "neutral",
          class: "text-white",
        },
        {
          variant: "solid",
          color: "secondary",
          class: "text-white",
        },
        {
          variant: "solid",
          color: "warning",
          class: "text-black",
        },
        {
          variant: "solid",
          color: "error",
          class: "text-white",
        },
        {
          variant: "solid",
          color: "primary",
          class: "text-white",
        },
      ],
    },
  },
});
