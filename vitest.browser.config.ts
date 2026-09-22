import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import sharedViteConfig from './vite.config.shared'

export default defineConfig({
  ...sharedViteConfig,
  test: {
    ...sharedViteConfig.test,
    include: ['src/**/*.browser.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: [
      fileURLToPath(new URL('./vitest.setup.ts', import.meta.url)),
      fileURLToPath(new URL('./vitest.browser.setup.ts', import.meta.url)),
    ],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1400, height: 700 },
    },
  },
})
