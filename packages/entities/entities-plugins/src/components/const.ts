import type { InjectionKey } from 'vue'

/** Register a before-save guard. The callback returns true to allow saving, false to block it.
 * Returns an unregister function to remove the guard when the component unmounts. */
export const BEFORE_SAVE_KEY: InjectionKey<(cb: () => boolean) => () => void> = Symbol('before-save')
