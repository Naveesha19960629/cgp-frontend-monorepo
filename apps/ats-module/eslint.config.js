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
];
