import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { validateProductionApiUrl } from './config/api-url.js';

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    validateProductionApiUrl(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL);
  }
  return { plugins: [react(), tailwindcss()] };
});
