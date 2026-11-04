import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 4321);
const iPhone = devices['iPhone 14'];

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'ar-KW',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // iPhone 14 (المقاس واللمس) على محرك Chromium
    { name: 'iphone', use: { ...iPhone, browserName: 'chromium', defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Safari الفعلي (WebKit) — يُفعّل في CI حيث يُثبَّت المتصفح
    ...(process.env.E2E_WEBKIT === '1' ? [{ name: 'iphone-webkit', use: { ...iPhone } }] : []),
  ],
  webServer: {
    command: 'node scripts/e2e-server.mjs',
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { E2E_PORT: String(port) },
  },
});
