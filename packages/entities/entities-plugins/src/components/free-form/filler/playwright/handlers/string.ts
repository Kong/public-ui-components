import type { StringFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillString(option: HandlerOption<StringFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  await element.clear()
  if (value !== undefined && value !== null && value !== '') {
    await element.fill(String(value))
  }
}
