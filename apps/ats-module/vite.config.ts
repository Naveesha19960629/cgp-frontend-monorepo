import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    federation({
      name: 'ats-module',
      filename: 'remoteEntry.js',
      exposes: {
        './Vacancyies': './src/vacancyies.tsx',
        './AtsRoutes': './src/app/router/index.tsx',
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
    port: 5173,
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
