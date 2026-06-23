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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const atsModuleUrl = env.VITE_ATS_MODULE_URL || 'http://localhost:5173';

  return {
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
          'ats-module': `${atsModuleUrl}/assets/remoteEntry.js`,
          from: 'vite',
          format: 'esm',
        },

        shared: {
          react: { singleton: true, eager: true, requiredVersion: '^19.0.0' },
          'react-dom': {
            singleton: true,
            eager: true,
            requiredVersion: '^19.0.0',
          },
          'react-router-dom': { singleton: true, eager: true },
          i18next: { singleton: true, eager: true },
          'react-i18next': { singleton: true, eager: true },
          '@tanstack/react-query': { singleton: true, eager: true },
          'keycloak-js': { singleton: true, eager: true },
          '@react-keycloak/web': { singleton: true, eager: true },
          nuqs: { singleton: true, eager: true },
          '@base-ui/react': { singleton: true, eager: true },
          cmdk: { singleton: true, eager: true },
          '@radix-ui/react-dialog': { singleton: true, eager: true },
          '@radix-ui/react-popover': { singleton: true, eager: true },
          sonner: { singleton: true, eager: true },
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
  };
});
