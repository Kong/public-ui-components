import { type MapHandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import type { MapFieldSchema } from '../../../form-schema'

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
  const { fieldKey, fieldSchema, value, onFillEntry } = option
  const keySchema = (fieldSchema as MapFieldSchema).keys
  const isEnumKey = keySchema?.type === 'string' && !!keySchema.one_of?.length

  // Clear existing entries
  const mapRemoveBtnsSelector = selectors.mapRemoveBtns(fieldKey)

  const removeNext = () => {
    cy.get('body').then(($body) => {
      const $btn = $body.find(mapRemoveBtnsSelector).first()
      if ($btn.length > 0) {
        cy.wrap($btn).click(SCROLL_BEHAVIOR)
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

    const addBtnSelector = selectors.mapAddBtn(fieldKey)
    scrollIntoViewNative(addBtnSelector)
    cy.get(addBtnSelector).click(SCROLL_BEHAVIOR)

    const mapKeySelector = selectors.mapKey(fieldKey, i)
    scrollIntoViewNative(mapKeySelector)
    if (isEnumKey) {
      // Enum keys are picked from a select
      cy.get(mapKeySelector).click(SCROLL_BEHAVIOR)
      cy.get(selectors.mapKeyItems(fieldKey, i)).find(selectors.selectItem(String(key))).click(SCROLL_BEHAVIOR)
    } else {
      cy.get(mapKeySelector).clear(SCROLL_BEHAVIOR)
      cy.get(mapKeySelector).type(String(key), SCROLL_BEHAVIOR)
    }

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
