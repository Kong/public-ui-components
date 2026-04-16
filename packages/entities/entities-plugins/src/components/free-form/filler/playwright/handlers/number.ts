import type { NumberLikeFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillNumber(option: HandlerOption<NumberLikeFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  await element.clear()
  if (value !== undefined && value !== null) {
    await element.fill(String(value))
  }
}
