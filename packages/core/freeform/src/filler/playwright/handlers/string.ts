import type { StringFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillString(option: HandlerOption<StringFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const element = page.locator(selectors.field(fieldKey))

  await element.fill(value == null ? '' : String(value))
  // Commit explicitly: a controlled textarea can restore its old value before blur.
  await element.dispatchEvent('change')
  await element.blur()
}
