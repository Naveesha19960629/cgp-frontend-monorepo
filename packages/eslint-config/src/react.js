// @ts-check
import vitest from '@vitest/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

import baseConfig from './base.js';

// Keyboard/screen-reader guard (DQCGP-4310). The recommended set starts as
// warnings so the existing backlog doesn't break the build; the rules below
// that caught this CR's defects are errors so they can't come back.
const isOff = entry =>
  (Array.isArray(entry) ? entry[0] : entry) === 'off' ||
  (Array.isArray(entry) ? entry[0] : entry) === 0;
const jsxA11yRecommendedAsWarnings = Object.fromEntries(
  Object.entries(jsxA11y.configs.recommended.rules)
    .filter(
      ([rule, entry]) => !isOff(entry) && rule.split('/')[1] in jsxA11y.rules
    )
    .map(([rule, entry]) => [
      rule,
      Array.isArray(entry) ? ['warn', ...entry.slice(1)] : 'warn',
    ])
);

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      vitest,
    },
    rules: {
      // React
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Vitest
      ...vitest.configs.recommended.rules,
      'vitest/require-top-level-describe': 1,
      'vitest/consistent-test-it': 1,
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.configs.recommended,
    rules: {
      ...jsxA11yRecommendedAsWarnings,
      // Click-only controls: the defect class behind most of DQCGP-4310.
      'jsx-a11y-x/click-events-have-key-events': 'error',
      'jsx-a11y-x/no-static-element-interactions': 'error',
      'jsx-a11y-x/interactive-supports-focus': 'error',
      // Prefer a native <button> to role="button" on a span.
      'jsx-a11y-x/prefer-tag-over-role': 'warn',
      // Icon-only buttons need a name (the chip remove buttons had none).
      'jsx-a11y-x/control-has-associated-label': [
        'warn',
        { ignoreElements: ['input', 'textarea', 'select'] },
      ],
    },
    settings: {
      'jsx-a11y-x': {
        // Our wrappers render these native elements.
        components: {
          Button: 'button',
          Input: 'input',
          Textarea: 'textarea',
          Label: 'label',
          FormLabel: 'label',
        },
      },
    },
  },
];
