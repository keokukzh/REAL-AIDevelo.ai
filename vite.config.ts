import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 4000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        chunkSizeWarningLimit: 500, // Reduced from 1200KB to 500KB
        // Disable source maps in production to avoid eval() usage
        sourcemap: false,
        rollupOptions: {
          output: {
            format: 'es',
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
            manualChunks: undefined,
          },
        },
        // Ensure public files (including _routes.json) are copied to dist
        copyPublicDir: true,
      },
      // Removed API key definitions - API keys should NEVER be exposed in client bundle
      // All external API calls should go through the backend
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom'],
      },
      test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        globals: true,
        css: true,
        testTimeout: 10000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/*.e2e.{test,spec}.{ts,tsx}'],
        include: ['src/**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
        coverage: {
          reporter: ['text', 'html'],
          include: ['src/**/*.{ts,tsx}'],
          thresholds: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      }
    };
});
