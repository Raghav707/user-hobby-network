// File: backend/vitest.config.ts

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Allows us to use test functions without importing them
    include: ['src/tests/**/*.test.ts'], // Tells vitest where to find test files
    setupFiles: [], // We'll add a setup file later if needed
  },
});