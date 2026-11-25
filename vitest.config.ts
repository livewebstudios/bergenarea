import { defineConfig } from 'vitest/config';

// Forked processes so the tests can change process.env.TZ and prove the
// New York math holds no matter what zone the machine is set to.
export default defineConfig({
  test: { pool: 'forks', include: ['tests/**/*.test.ts'] },
});
