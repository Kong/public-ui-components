import { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'

// Use jsdom storage instead of Node 26's native Web Storage in DOM tests.
if (typeof window !== 'undefined') {
  vi.stubGlobal('localStorage', window.localStorage)
  vi.stubGlobal('sessionStorage', window.sessionStorage)
}

/**
 * Add `getTestId` helper to all wrappers so tests can use
 * `wrapper.getTestId('my-id')` instead of `wrapper.get('[data-testid="my-id"]')`.
 */
const getTestId = function(this: VueWrapper | DOMWrapper<Node>, testId: string) {
  return this.get(`[data-testid="${testId}"]`)
}

/**
 * Add `findTestId` helper to all wrappers so tests can use
 * `wrapper.findTestId('my-id')` instead of `wrapper.find('[data-testid="my-id"]')`.
 */
const findTestId = function(this: VueWrapper | DOMWrapper<Node>, testId: string) {
  return this.find(`[data-testid="${testId}"]`)
}

// Attach to both wrapper prototypes
VueWrapper.prototype.getTestId = getTestId
VueWrapper.prototype.findTestId = findTestId
DOMWrapper.prototype.getTestId = getTestId
DOMWrapper.prototype.findTestId = findTestId
