import reactConfig from '@cgp/eslint-config/react';

export default [
  ...reactConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
];
