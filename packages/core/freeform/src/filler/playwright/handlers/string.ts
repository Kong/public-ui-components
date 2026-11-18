import type { StringFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillString(option: HandlerOption<StringFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  if (await element.evaluate(el => el.classList.contains('cel-input'))) {
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
    return
  }

  await element.fill(value == null ? '' : String(value))
  // Commit explicitly: a controlled textarea can restore its old value before blur.
  await element.dispatchEvent('change')
  await element.blur()
}
