import type { JsonFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillJson(option: HandlerOption<JsonFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.json(fieldKey)
  const element = page.locator(selector).locator('textarea')

  const jsonString = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  await element.clear()
  await element.fill(jsonString)
}
