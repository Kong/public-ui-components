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

      // Enabling the switch expands the object's content via SlideTransition
      // (height animates from 0). Filling children immediately can hit them
      // mid-transition, when the content container still has height 0 and
      // `overflow: hidden`, making its fields fail Cypress's visibility
      // check. Wait for the container to finish expanding first.
      cy.get(selectors.objectContent(fieldKey)).should('be.visible')
    }

    // Fill children fields
    onFillChildren()
  })
}
