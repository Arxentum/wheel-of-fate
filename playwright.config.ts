import { defineConfig } from '@playwright/test';

/**
 * Smoke tests of the built site (npm run e2e builds it first). They use the Chrome
 * installed on this computer, so no browser download is needed; set PW_CHANNEL to
 * 'msedge' (or '' for Playwright's own Chromium) on another machine.
 */
const channel = process.env.PW_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.ts',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    viewport: { width: 1280, height: 720 },
    ...(channel ? { channel } : {}),
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
