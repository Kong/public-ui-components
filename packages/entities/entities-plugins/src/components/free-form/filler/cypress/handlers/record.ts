import type { RecordHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export function fillRecord(option: RecordHandlerOption): void {
  const { fieldKey, value, onFillChildren } = option

  const objectSwitchSelector = selectors.objectSwitch(fieldKey)

  cy.get('body').then(($body) => {
    const hasSwitch = $body.find(objectSwitchSelector).length > 0

    if ((value === null || value === undefined) && hasSwitch) {
      // Disable the object via switch. The switch's native checkbox input is
      // deliberately `display: none` (a styled label drives it instead), so
      // force is required here for a real reason - it's not a scroll/coverage
      // issue like elsewhere in this file.
      cy.get(objectSwitchSelector).uncheck({ force: true })
      return
    }

    if (hasSwitch) {
      // Enable the object via switch; see note above about force.
      cy.get(objectSwitchSelector).check({ force: true })

      // Enabling the switch expands the object's content via SlideTransition
      // (height animates from 0). Filling children immediately can hit them
      // mid-transition, when the content container still has height 0.
      // `should('be.visible')` isn't right here: it also requires the
      // container to be on-screen right now, which conflates "animation
      // done" with "scrolled into view" - the latter is unrelated and is
      // already handled per-field by each field's own scrollIntoViewNative/SCROLL_BEHAVIOR when
      // it's actually filled. Wait for the transition's own class instead,
      // regardless of current scroll position.
      cy.get(selectors.objectContent(fieldKey)).should('not.have.class', 'ff-slide-active')
    }

    // Fill children fields
    onFillChildren()
  })
}
