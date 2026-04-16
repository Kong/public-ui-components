import type { BooleanFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillBoolean(option: HandlerOption<BooleanFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  if (value === true) {
    await element.check({ force: true })
  } else if (value === false) {
    await element.uncheck({ force: true })
  }
}
