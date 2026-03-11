---
name: nuxt-ui-frontend
description: Build or modify UI components, pages, or layouts with Nuxt 3, Vue 3, Nuxt UI, and Tailwind. Use when creating or refactoring frontend elements. Nuxt UI is mandatory in this project.
---

# Nuxt UI Frontend

Build or modify Vue 3 components, pages, or layouts using **Nuxt UI** and Tailwind CSS. Follow `.cursor/rules/nuxt-vue3-components.mdc` and `.cursor/rules/stack-and-mcp.md`.

## Mandatory: Nuxt UI first

- Prefer Nuxt UI components over custom markup. Use `UButton`, `UInput`, `USelect`, `UForm`, `UFormField`, `UTable`, `UCard`, `UModal`, `UAlert`, `UBadge`, `useToast()`, etc.
- If the project has a Nuxt UI MCP server, use it to look up component props and examples.
- Only build custom UI when no Nuxt UI primitive fits.

## Conventions

- `<script setup lang="ts">`, Composition API, TypeScript. No manual imports of `ref`, `computed`, `useRoute`, etc. (Nuxt auto-imports).
- Props/emits: `defineProps<Props>()`, `defineEmits<Emits>()` with types.
- Styling: Tailwind only; mobile-first (`sm:`, `md:`, `lg:`). No custom CSS unless unavoidable.
- Data: `useFetch` / `useAsyncData` in components; composables in `composables/` for reusable logic.
- File names: components `PascalCase.vue`, pages `kebab-case.vue`, composables `use*.ts`.

## Workflow

1. Check `components/` for existing components to reuse or extend.
2. Plan the component tree (atoms → molecules → page).
3. Implement with Nuxt UI + Tailwind; verify responsive behavior.
4. Use `:key` with stable ids in `v-for`; prefer `<ClientOnly>` for browser-only content to avoid hydration issues.

## SSR

- `useSupabaseUser()` shape differs in SSR (has `sub`, not `id`) vs client. Use a `getUserId()` helper that checks both when passing user id to composables or API.
