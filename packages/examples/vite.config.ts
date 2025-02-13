import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 示例应用构建配置
export default defineConfig({
  plugins: [react()],
  base:
    process.env.NODE_ENV === 'production'
      ? '/simulation-3D-City-performance/'
      : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
