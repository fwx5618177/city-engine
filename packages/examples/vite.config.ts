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
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
});
