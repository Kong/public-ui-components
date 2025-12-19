/// <reference types='cypress' />
import 'cypress-real-events'
/**
 * Performs a drag and drop operation between two elements using Cypress real events
 * @param source - The data-testid of the source element
 * @param destination - The data-testid of the destination element
 */
export function dragTile(source: string, destination: string, dragTarget: string = '.tile-header') {
  return cy.get(`[data-testid=${source}]`).then(($sourceTile) => {
    return cy.get(`[data-testid=${destination}]`).then(($destTile) => {
      const dragTargetEl = $sourceTile.find(dragTarget)[0]
      const sourceRect = dragTargetEl?.getBoundingClientRect() || $sourceTile[0]?.getBoundingClientRect()
      const destRect = $destTile[0]?.getBoundingClientRect()

      if (sourceRect === undefined || destRect === undefined) {
        return cy.wrap(dragTargetEl)
      }

      const startX = sourceRect.left + (sourceRect.width / 2)
      const startY = sourceRect.top + (sourceRect.height / 2)
      const endX = destRect.left + (destRect.width / 2)
      const endY = destRect.top + (destRect.height / 2)

      return cy.wrap(dragTargetEl)
        .realMouseDown({ position: 'center' })
        .realMouseMove(startX, startY)
        .realMouseMove(endX, endY)
        .realMouseUp()
    })
  })
}
