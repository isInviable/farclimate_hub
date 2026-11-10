import { loadJS, loadCSS } from "markmap-common";
import { Transformer } from "markmap-lib";
import * as markmap from "markmap-view";

export const transformer = new Transformer();

// loadCSS/loadJS touch `document`; this module also ends up in the SSR bundle
// via explicit `.client.vue` imports, where an unhandled rejection crashes the Netlify function.
if (import.meta.client) {
  const { scripts, styles } = transformer.getAssets();
  loadCSS(styles);
  loadJS(scripts, { getMarkmap: () => markmap });
}
