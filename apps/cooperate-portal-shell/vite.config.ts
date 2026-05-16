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
      remotes: {
        'ats-module': 'http://localhost:4173/assets/remoteEntry.js',
        from: 'vite',
        format: 'esm',
      },
      shared: ['react', 'react-dom', '@tanstack/react-query'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
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
