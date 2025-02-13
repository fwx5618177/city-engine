import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 示例应用构建配置
export default defineConfig({
  plugins: [react()],
  base: '/simulation-3D-City-performance/',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
      },
    },
  },
});
