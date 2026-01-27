import type { RecordHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export function fillRecord(option: RecordHandlerOption): void {
  const { fieldKey, value, onFillChildren } = option

  const objectSwitchSelector = selectors.objectSwitch(fieldKey)

  cy.get('body').then(($body) => {
    const hasSwitch = $body.find(objectSwitchSelector).length > 0

    if ((value === null || value === undefined) && hasSwitch) {
      // Disable the object via switch
      cy.get(objectSwitchSelector).uncheck({ force: true })
      return
    }

    if (hasSwitch) {
      // Enable the object via switch
      cy.get(objectSwitchSelector).check({ force: true })
    }

    // Fill children fields
    onFillChildren()
  })
}
