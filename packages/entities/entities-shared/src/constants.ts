import type { InjectionKey, Ref } from 'vue'

import type DeckCommandEditor from './components/common/DeckCommandEditor.vue'

export const PLUGIN_FORM_LAYOUT_STATE: InjectionKey<Ref<boolean>> = Symbol('PLUGIN_FORM_LAYOUT_STATE')

/**
 * The injection key for providing the `DeckCommandEditor` component.
 *
 * For:
 * - decK command customization
 *
 * Usage:
 * ```ts
 * // In the host app
 * import { provide } from 'vue'
 * import { DECK_COMMAND_EDITOR_KEY } from '@kong-ui-public/entities-shared'
 * import { DeckCommandEditor } from '@kong-ui-public/entities-shared/deck-editor'
 * provide(DECK_COMMAND_EDITOR_KEY, DeckCommandEditor)
 * ```
 *
 * See `provideDeckCommandEditor` from `@kong-ui-public/entities-shared/deck-editor`
 * for the convenient helper.
 */
export const DECK_COMMAND_EDITOR_KEY: InjectionKey<typeof DeckCommandEditor> = Symbol('DECK_COMMAND_EDITOR')

export const DECK_COMMAND_EDITOR_MISSING_WARNING = '[entities-shared] DeckCommandEditor was not provided. Provide it via the `DECK_COMMAND_EDITOR_KEY` injection key or the `provideDeckCommandEditor` helper (see @kong-ui-public/entities-shared/deck-editor).'
