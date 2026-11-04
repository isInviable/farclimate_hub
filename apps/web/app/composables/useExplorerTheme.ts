/** Puts the ADAPTARIUM explorer theme class on <body> while the calling layout is mounted. */
export function useExplorerTheme() {
  useHead({
    bodyAttrs: { class: 'theme-explorer-adapt' },
  })
}
