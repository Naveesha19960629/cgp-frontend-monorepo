import reactConfig from '@cgp/eslint-config/react';

export default [
  // Static runtime assets served as-is (not part of the TS program).
  // Without this, type-aware rules run on public/runtime-config.js and crash
  // because no tsconfig provides parser services for it.
  { ignores: ['public/**'] },
  ...reactConfig,
];
