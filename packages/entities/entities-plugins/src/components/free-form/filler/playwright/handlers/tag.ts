import type { SetFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillTag(option: HandlerOption<SetFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const values = Array.isArray(value) ? value : [value]
  const selector = selectors.tagInput(fieldKey)
  const element = page.locator(selector)

  await element.fill(values.join(','))
}
