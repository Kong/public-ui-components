import type { SetFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillTag(option: HandlerOption<SetFieldSchema>): void {
  const { fieldKey, value } = option

  const values = Array.isArray(value) ? value : [value]
  const selector = selectors.tagInput(fieldKey)

  scrollIntoViewNative(selector)
  cy.get(selector).type(values.join(','), SCROLL_BEHAVIOR)
}
