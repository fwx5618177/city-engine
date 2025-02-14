import { resolve } from 'path';
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@context': path.resolve(__dirname, './src/context'),
      '@components': path.resolve(__dirname, './src/components'),
      '@configs': path.resolve(__dirname, './src/configs'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@styles/variables" as *;
          @use "@styles/mixins" as mix;
        `,
        includePaths: [path.resolve(__dirname, 'src/styles')],
      },
    },
  },
});
