import reactConfig from '@cgp/eslint-config/react';

export default [
  ...reactConfig,
  {
    // import-x/export uses the TypeScript resolver which fails with
    // "invalid interface" on barrel re-exports when projectService is active.
    // TypeScript itself already detects real duplicate-export conflicts.
    rules: {
      'import-x/export': 'off',
    },
  },

  // ── ATS Module: no httpClient / service calls in UI layers ──────────────
  // Components, pages, and context must never call httpClient directly.
  // All server interactions must go through a React Query hook.
  {
    files: [
      'src/views/**/components/**/*.{ts,tsx}',
      'src/views/**/pages/**/*.{ts,tsx}',
      'src/views/**/context/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@cgp/data-access',
              importNames: ['httpClient'],
              message:
                'Do not import httpClient in UI layers. Use a React Query hook instead (see hooks/queries or hooks/mutations).',
            },
          ],
        },
      ],
    },
  },

  // ── ATS Module: enforce barrel imports ──────────────────────────────────
  // Outside code must import through a folder's index.ts, never from leaf files.
  // Barrel files (index.ts) are excluded so they can re-export their own leaves.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      // Barrel files are allowed to import their own leaf files
      'src/**/services/index.ts',
      'src/**/hooks/queries/index.ts',
      'src/**/hooks/mutations/index.ts',
      'src/**/components/index.ts',
      'src/**/pages/index.ts',
      'src/**/utils/index.ts',
      'src/**/hooks/index.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // e.g. @/views/vacancies/hooks/queries/use-genders-query
              group: [
                '@/views/**/hooks/queries/*',
                '@/views/**/hooks/mutations/*',
              ],
              message:
                'Import hooks from the hooks barrel (hooks/index.ts), not directly from leaf hook files.',
            },
            {
              // e.g. @/views/vacancies/services/gender.service
              group: ['@/views/**/services/*.service'],
              message:
                'Import services from the services barrel (services/index.ts), not directly from leaf service files.',
            },
          ],
        },
      ],
    },
  },
];
