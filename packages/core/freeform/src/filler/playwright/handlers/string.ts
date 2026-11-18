import type { StringFieldSchema } from '../../../form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { fillCelInput } from './cel'

export async function fillString(option: HandlerOption<StringFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const element = page.locator(selector)

  // Conditions, ACL rules and expression twins can render their string as a CEL input.
  if (await element.evaluate(el => el.classList.contains('cel-input'))) {
    await fillCelInput(page, element, value)
    return
  }

  await element.fill(value == null ? '' : String(value))
  // Commit explicitly: a controlled textarea can restore its old value before blur.
  await element.dispatchEvent('change')
  await element.blur()
}
