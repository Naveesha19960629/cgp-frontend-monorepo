import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

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
        'ats-module':
          process.env.VITE_ATS_MODULE_URL + '/assets/remoteEntry.js',
        from: 'vite',
        format: 'esm',
      },

      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.2.5',
          version: '19.2.5',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.2.5',
          version: '19.2.5',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^7.15.0',
          version: '7.15.0',
        },
        i18next: {
          singleton: true,
          requiredVersion: '^26.0.1',
          version: '26.1.0',
        },
        'react-i18next': {
          singleton: true,
          requiredVersion: '^17.0.6',
          version: '17.0.6',
        },
        '@tanstack/react-query': {
          singleton: true,
          requiredVersion: '^5.80.5',
          version: '5.100.9',
        },
        'keycloak-js': {
          singleton: true,
          requiredVersion: '^26.2.4',
          version: '26.2.4',
        },
        '@react-keycloak/web': {
          singleton: true,
          requiredVersion: '^3.4.0',
          version: '3.4.0',
        },
      },
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
    ],
  },

  server: {
    port: 5174,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
        'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Requested-With',
    },
  },

  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
  },
});
