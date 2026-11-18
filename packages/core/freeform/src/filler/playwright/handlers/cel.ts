import type { Locator, Page } from '@playwright/test'

/** Replace the whole Monaco model of a rendered CEL input. */
export async function fillCelInput(page: Page, element: Locator, value: unknown): Promise<void> {
  const input = element.locator('.monaco-editor textarea')
  // Monaco owns the text model. DOM clear() only edits its input buffer.
  // Its shortcuts follow the browser user agent, including emulated platforms.
  const selectAll = await input.evaluate(() => navigator.userAgent.includes('Macintosh') ? 'Meta+A' : 'Control+A')
  await input.press(selectAll)
  await input.press('Backspace')
  if (value !== undefined && value !== null && value !== '') {
    await page.keyboard.insertText(String(value))
  }
  await input.press('Escape')
  await input.blur()
}
