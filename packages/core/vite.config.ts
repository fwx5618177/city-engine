import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Lib 构建配置
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    }),
  ],
  build: {
    target: 'es2015',
    lib: {
      entry: 'src/index.ts',
      name: 'CityEngine',
      fileName: (format) => `city-engine.${format}.js`,
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom', '@babylonjs/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@babylonjs/core': 'BABYLON',
        },
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'chunks/[name].[hash].js',
      },
    },
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@babylonjs/core'],
  },
});
