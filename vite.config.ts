import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/assets': resolve(__dirname, 'src/assets'),
      '@/scenes': resolve(__dirname, 'src/scenes'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  optimizeDeps: {
    include: ['pixi.js'],
  },
}); 