/**
 * This is a polyfill for monaco editor running in JSDOM environment.
 */

if (typeof document !== 'undefined' && typeof document.queryCommandSupported !== 'function') {
  Object.defineProperty(document, 'queryCommandSupported', {
    configurable: true,
    value: () => false,
  })
}
