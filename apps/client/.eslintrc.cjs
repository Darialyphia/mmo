const { off } = require('process');

/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier',
    'plugin:prettier/recommended',
    'plugin:vuejs-accessibility/recommended',
    'plugin:@intlify/vue-i18n/recommended'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-ignore': 'allow-with-description' }
    ],
    'vuejs-accessibility/label-has-for': [
      'error',
      {
        required: {
          some: ['nesting', 'id']
        },
        allowChildren: false,
        controlComponents: ['ui-input-text', 'ui-input-password']
      }
    ],

    'vuejs-accessibility/form-control-has-label': [
      'error',
      {
        labelComponents: ['ui-form-control']
      }
    ],
    '@intlify/vue-i18n/no-missing-keys-in-other-locales': 'warn',
    '@intlify/vue-i18n/no-deprecated-i18n-component': 'error',
    '@intlify/vue-i18n/no-i18n-t-path-prop': 'error'
    // '@intlify/vue-i18n/no-raw-text': 'off'
  },
  overrides: [
    {
      files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended']
    }
  ],
  settings: {
    'vue-i18n': {
      // path needs to be relative to monorepo root because the dependency is hoisted to root node_modules
      localeDir: './apps/client/locales/*.{json,json5,yaml,yml}'
    }
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
};
