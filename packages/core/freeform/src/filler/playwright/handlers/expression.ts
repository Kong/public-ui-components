import type { ExpressionFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

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

  await fillString(option)
}
