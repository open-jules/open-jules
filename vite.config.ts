import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/backend/data/tasks.json'],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});