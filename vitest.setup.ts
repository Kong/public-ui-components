import { DOMWrapper, VueWrapper } from '@vue/test-utils'

/**
 * Add `getTestId` helper to all wrappers so tests can use
 * `wrapper.getTestId('my-id')` instead of `wrapper.find('[data-testid="my-id"]')`.
 */

const getTestId = function(this: VueWrapper | DOMWrapper<Node>, testId: string) {
  return this.find(`[data-testid="${testId}"]`)
}

// Attach to both wrapper prototypes
VueWrapper.prototype.getTestId = getTestId
DOMWrapper.prototype.getTestId = getTestId
