import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Removed API key definitions - API keys should NEVER be exposed in client bundle
      // All external API calls should go through the backend
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          'react': path.resolve(__dirname, './node_modules/react'),
          'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        globals: true,
        css: true,
        coverage: {
          reporter: ['text', 'html'],
          include: ['src/**/*.{ts,tsx}'],
        },
      }
    };
});
