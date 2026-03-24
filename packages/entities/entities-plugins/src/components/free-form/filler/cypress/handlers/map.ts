import type { MapHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

function extractKidId(testId: string | undefined, fieldKey: string): string {
  if (!testId) {
    throw new Error(`Unable to find map entry test id for "${fieldKey}"`)
  }

  const match = testId.match(/kid:\d+/)

  if (!match) {
    throw new Error(`Unable to extract map entry kid id from test id "${testId}"`)
  }

  return match[0]
}

export function fillMap(option: MapHandlerOption): void {
  const { fieldKey, value, onFillEntry } = option

  // Clear existing entries
  const mapRemoveBtnsSelector = selectors.mapRemoveBtns(fieldKey)

  const removeNext = () => {
    cy.get('body').then(($body) => {
      const $btn = $body.find(mapRemoveBtnsSelector).first()
      if ($btn.length > 0) {
        cy.wrap($btn).click()
        removeNext()
      }
    })
  }
  removeNext()

  if (typeof value !== 'object' || value == null) {
    return
  }

  const entries = Object.entries(value)
  if (entries.length === 0) {
    return
  }

  for (let i = 0; i < entries.length; i++) {
    const [key, val] = entries[i]

    cy.get(selectors.mapAddBtn(fieldKey)).click()

    cy.get(selectors.mapKey(fieldKey, i)).clear({ force: true }).type(String(key), { force: true })

    cy.get(selectors.mapContainer(fieldKey, i))
      .find(`[data-testid*="${fieldKey}.kid:"]`)
      .first()
      .invoke('attr', 'data-testid')
      .then((testId) => {
        const kidId = extractKidId(testId, fieldKey)
        onFillEntry(kidId, val)
      })
  }
}
