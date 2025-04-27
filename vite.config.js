import { defineConfig } from 'vite';
import size from 'vite-plugin-size';

export default defineConfig({
  plugins: [size()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser'
  }
}); 