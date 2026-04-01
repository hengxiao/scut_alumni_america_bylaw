const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // Run tests sequentially — they share a server and localStorage is per-origin
  fullyParallel: false,
  workers: 1,

  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:4000',
    // Capture trace on first retry to help debug failures
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'node serve.js 4000',
    url: 'http://localhost:4000/questionnaire.html',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
