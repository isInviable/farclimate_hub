export default defineAppConfig({
  ui: {
    colors: {
      primary: "trust-blue",
      neutral: "slate",
    },
    // Global UButton theme: https://ui.nuxt.com/docs/getting-started/theme#app-config
    // Generated defaults: apps/web/.nuxt/ui/button.ts
    button: {
      compoundVariants: [
        {
          variant: "outline",
          // Border follows label/icon color (currentColor) for every `color` prop
          class: "border border-current",
        },
      ],
    },
    badge: {
      slots: {
        base: "font-semibold ", // or font-medium, font-normal, …
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
