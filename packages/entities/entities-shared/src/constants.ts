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

/**
 * Code block needs a max height to enable virtual scrolling.
 */
export const CONFIG_CARD_CODE_BLOCK_MAX_HEIGHT = '50vh'

/**
 * Shiki's JS regex engine tokenizes synchronously on the main thread and emits one DOM element
 * per token, so very large documents (e.g. a decK YAML dump with tens of thousands of lines)
 * can block the tab for a long time and bloat the DOM. Past this size, skip highlighting and
 * keep the plain-text rendering that KCodeBlock already produces via `v-html`.
 */
export const SHIKI_MAX_HIGHLIGHT_LENGTH = 200_000
