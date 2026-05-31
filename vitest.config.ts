import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Net-new test harness (S2 / #6). Unit tests for pure modules only.
// Default environment is `node`; modules that touch the DOM/React opt in
// per-file with a `// @vitest-environment jsdom` comment at the top.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tina/__generated__'],
  },
});
