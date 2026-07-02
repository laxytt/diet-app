import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2018',
    cssMinify: false,
    rollupOptions: {
      input: 'index.html'
    }
  }
});
