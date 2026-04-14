import type { DOMWrapper } from '@vue/test-utils'

declare module '@vue/test-utils' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface VueWrapper<VM = unknown, T = unknown> {
    getTestId<E extends Element = Element>(testId: string): DOMWrapper<E>
    findTestId<E extends Element = Element>(testId: string): DOMWrapper<E>
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface DOMWrapper<NodeType extends Node> {
    getTestId<E extends Element = Element>(testId: string): DOMWrapper<E>
    findTestId<E extends Element = Element>(testId: string): DOMWrapper<E>
  }
}
