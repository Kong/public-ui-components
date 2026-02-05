import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.pw.ts',
  snapshotDir: './__snapshots__',
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    ctViteConfig: {
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern',
            additionalData: '@use "@kong/design-tokens/tokens/scss/variables" as *;',
          },
        },
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
