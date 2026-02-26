// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Your custom configs here
  rules: {
    'prettier/prettier': 'off',

    // JS/TS indentation (from ESLint Stylistic)
    '@stylistic/js/indent': 'off',

    // Vue template/script indentation
    'vue/html-indent': 'off',
    'vue/script-indent': 'off'
  }
})
