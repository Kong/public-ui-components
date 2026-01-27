import type { SetFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from '../../shared/types'

export function fillTag(option: HandlerOption<SetFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const values = Array.isArray(value) ? value : [value]
  const selector = selectors.tagInput(fieldKey)

  cy.get(selector).type(values.join(','), actionOptions.type)
}
