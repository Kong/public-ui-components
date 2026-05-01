import { provide } from 'vue'

import { DECK_COMMAND_EDITOR_KEY } from './constants'
import DeckCommandEditor from './components/common/DeckCommandEditor.vue'
import DeckCommandEditorLoading from './components/common/DeckCommandEditorLoading.vue'

export { DeckCommandEditor, DeckCommandEditorLoading }

/**
 * Provides the `DeckCommandEditor` component via the `DECK_COMMAND_EDITOR_KEY` injection key.
 *
 * For:
 * - decK command customization
 *
 * Usage:
 * ```ts
 * // In the host app
 * import { provideDeckCommandEditor } from '@kong-ui-public/entities-shared/deck-editor'
 * provideDeckCommandEditor()
 * ```
 */
export function provideDeckCommandEditor() {
  provide(DECK_COMMAND_EDITOR_KEY, DeckCommandEditor)
}
