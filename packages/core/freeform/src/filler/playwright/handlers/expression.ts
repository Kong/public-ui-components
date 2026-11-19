import type { ExpressionFieldSchema, StringFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

/**
 * Fills the expression twin of an `expressible` field. Its input only exists
 * once the "Add expression" trigger has been used, so open it first when the
 * field is still collapsed. A host can render the twin as a CEL input.
 */
export async function fillExpression(option: HandlerOption<ExpressionFieldSchema>): Promise<void> {
  const { page, fieldKey } = option

  await page.locator(selectors.expression(fieldKey)).waitFor({ state: 'visible' })
  const trigger = page.locator(selectors.expressionAddBtn(fieldKey))

  if (await trigger.count()) {
    await trigger.click()
  }

  if (await page.locator(selectors.field(fieldKey)).evaluate(el => el.classList.contains('cel-input'))) {
    await fillCel(option)
  } else {
    await fillString(option)
  }
}

/**
 * Fills a CEL input, such as an expression twin, a plugin condition or an ACL
 * rule, by replacing its whole Monaco model.
 */
export async function fillCel(option: HandlerOption<StringFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const input = page.locator(selectors.field(fieldKey)).locator('.monaco-editor textarea')
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
