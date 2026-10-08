import path from 'path';
import { loadEnvConfig } from '@next/env';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
