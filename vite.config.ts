import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const src = path.join(distDir, 'index.html');
      const dest = path.join(distDir, '404.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✓ Copied index.html → 404.html for SPA routing');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://pesamatrix-backend--philipcraig11.replit.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
