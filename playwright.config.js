// playwright.config.js (ES module)
// VitaChain E2E configuration — auto-start Vite dev server

export default {
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000, // 2 min per test

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
  },

  // webServer is NOT used - test manages its own dev server
};
