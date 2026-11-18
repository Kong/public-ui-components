import type { ExpressionFieldSchema, StringFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { fillNativeString } from './string'

/**
 * Open a collapsed expression twin before filling its string control.
 */
export async function fillExpression(option: HandlerOption<ExpressionFieldSchema>): Promise<void> {
  const { page, fieldKey } = option

  await page.locator(selectors.expression(fieldKey)).waitFor({ state: 'visible' })
  const trigger = page.locator(selectors.expressionAddBtn(fieldKey))

  if (await trigger.count()) {
    await trigger.click()
  }

  await fillTextControl(option)
}

/** A condition or ACL rule also has a string schema. The rendered control selects the editing method. */
export async function fillTextControl(option: HandlerOption<StringFieldSchema>): Promise<void> {
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

  await fillNativeString(element, value)
}
