import type { ExpressionFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

/**
 * Fills the expression twin of an `expressible` field. Unlike a plain string
 * field, its textarea only exists once the "Add expression" trigger has been
 * used, so open it first when the field is still collapsed.
 */
export async function fillExpression(option: HandlerOption<ExpressionFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const input = page.locator(selectors.expressionInput(fieldKey))

  if (await input.count() === 0) {
    await page.locator(selectors.expressionAddBtn(fieldKey)).click()
  }

  await input.clear()
  if (value !== undefined && value !== null && value !== '') {
    await input.fill(String(value))
  }
}
