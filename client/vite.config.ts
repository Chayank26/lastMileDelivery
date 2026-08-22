import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite Frontend Bundler Configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API requests to backend during local development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Socket.io websockets
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
