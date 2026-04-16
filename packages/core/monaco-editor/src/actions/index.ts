import { formattingActions } from './formatting'
import { insertActions } from './insert'
import { listActions } from './list'
import { blockActions } from './block'
import { navigationActions } from './navigation'
import { viewActions } from './view'

/**
 * All built-in toolbar actions organized by category.
 * To add new actions:
 * 1. Create or update a category file (e.g., formatting.ts, navigation.ts)
 * 2. Export the action in the category file
 * 3. Import and spread it here
 */
export const BUILT_IN_TOOLBAR_ACTIONS = {
  ...formattingActions,
  ...insertActions,
  ...listActions,
  ...blockActions,
  ...navigationActions,
  ...viewActions,
}

export { createWrapAction, createInsertAction, createLinePrefixAction } from './helpers'
export { registerMarkdownShortcuts } from './markdownShortcuts'
