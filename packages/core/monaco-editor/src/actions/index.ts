import { formattingActions } from './formatting'
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
  ...navigationActions,
  ...viewActions,
}

export { createWrapAction } from './helpers'
