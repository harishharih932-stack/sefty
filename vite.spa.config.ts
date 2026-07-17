import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'esbuild', // Use esbuild instead of lightningcss to avoid parsing errors with new Tailwind syntax
  },
});