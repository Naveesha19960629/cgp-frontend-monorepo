import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'cooperate-portal-shell',
      filename: 'remoteEntry.js',
      exposes: {
        './i18n': './src/app/utils/i18n/index.ts',
        './KeycloakContext': './src/app/contexts/keycloak-context.tsx',
        './UserContext': './src/app/contexts/user-context.tsx',
        './keycloak': './src/app/services/keycloak.ts',
      },
      remotes: {
        'ats-module': 'http://localhost:4173/assets/remoteEntry.js',
        from: 'vite',
        format: 'esm',
      },
      shared: [
        'react',
        'react-dom',
        'react-router-dom',
        'i18next',
        'react-i18next',
        '@tanstack/react-query',
        'keycloak-js',
        '@react-keycloak/web',
        'nuqs',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-router-dom',
      'i18next',
      'react-i18next',
      '@tanstack/react-query',
      'keycloak-js',
      '@react-keycloak/web',
      'nuqs',
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
  },
});
