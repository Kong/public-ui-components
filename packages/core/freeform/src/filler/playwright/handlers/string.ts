import type { Locator } from '@playwright/test'

export async function fillNativeString(element: Locator, value: unknown): Promise<void> {
  await element.fill(value == null ? '' : String(value))
  // Commit explicitly: a controlled textarea can restore its old value before blur.
  await element.dispatchEvent('change')
  await element.blur()
}
