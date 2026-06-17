import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// singleton and eager are valid runtime options omitted from the published .d.ts
declare module '@originjs/vite-plugin-federation' {
  interface SharedConfig {
    singleton?: boolean;
    eager?: boolean;
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_FRONTEND_BASE_URL || '/',
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
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          'react-router-dom': { singleton: true },
          i18next: { singleton: true },
          'react-i18next': { singleton: true },
          '@tanstack/react-query': { singleton: true },
          'keycloak-js': { singleton: true },
          '@react-keycloak/web': { singleton: true },
          nuqs: { singleton: true },
          '@base-ui/react': { singleton: true },
          cmdk: { singleton: true },
          '@radix-ui/react-dialog': { singleton: true },
          '@radix-ui/react-popover': { singleton: true },
          sonner: { singleton: true },
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
        'nuqs',
        '@radix-ui/react-dialog',
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
  };
});
