import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the built site works from any sub-folder of a static host.
  base: './',
  plugins: [react()],
});
