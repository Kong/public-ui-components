import type { CelFieldSchema, ExpressionFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

/**
 * Fills an expression twin or a frontend CEL field. Only twins can be collapsed
 * behind an "Add expression" trigger; explicit CEL fields render directly.
 */
export async function fillExpression(option: HandlerOption<ExpressionFieldSchema | CelFieldSchema>): Promise<void> {
  const { page, fieldKey, fieldSchema } = option

  if (fieldSchema.type !== 'cel') {
    await page.locator(selectors.expression(fieldKey)).waitFor({ state: 'visible' })
    const trigger = page.locator(selectors.expressionAddBtn(fieldKey))

    if (await trigger.count()) {
      await trigger.click()
    }
  }

  await fillString(option)
}
