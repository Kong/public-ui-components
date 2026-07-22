import type { ForeignFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillForeign(option: HandlerOption<ForeignFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  // ForeignField.vue renders a plain text input where the referenced entity's
  // id is typed directly - there is no dropdown/select-item popover to pick from.
  const itemValue = typeof value === 'object' && value?.id ? value.id : value

  await element.clear()
  if (itemValue) {
    await element.fill(String(itemValue))
  }
}
