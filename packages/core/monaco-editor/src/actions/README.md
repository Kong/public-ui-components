# Monaco Editor Toolbar Actions

This directory contains all built-in toolbar actions for the Monaco Editor component, organized by category for easy maintenance and extensibility.

## Structure

```
actions/
├── index.ts           # Aggregates all actions
├── helpers.ts         # Reusable utilities for creating actions
├── formatting.ts      # Text formatting actions (bold, italic, format, etc.)
├── navigation.ts      # Navigation actions (search, goto, etc.)
└── view.ts            # View-related actions (fullscreen, etc.)
```

## Adding a New Action

### 1. Choose or Create a Category File

Add your action to an existing category file (e.g., `formatting.ts`, `navigation.ts`) or create a new one if it represents a new category.

### 2. Define Your Action

```typescript
// Example: adding a new action to formatting.ts
import { MyIcon } from '@kong/icons'
import type { MonacoEditorActionConfig } from './types'

export const formattingActions: Record<string, MonacoEditorActionConfig> = {
  // ... existing actions
  
  myNewAction: {
    id: 'editor.action.myNewAction',
    icon: MyIcon,
    label: 'editor.labels.action_my_new',
    action: (monaco) => {
      // Your action logic here
      const editor = monaco.editor.value
      if (!editor) return
      
      // Do something with the editor
      editor.trigger('keyboard', 'someCommand', null)
    },
    keybindings: ['Command', 'K'],
    placement: 'left', // 'left' | 'center' | 'right'
    order: 5,
    group: 2,
    showInContextMenu: true,
    contextMenuGroupId: 'formatting',
    contextMenuOrder: 5,
    languages: ['javascript', 'typescript'], // Optional: restrict to specific languages
  },
}
```

### 3. Add Translation Key

Add the label translation to `src/locales/en.json`:

```json
{
  "editor": {
    "labels": {
      "action_my_new": "My New Action"
    }
  }
}
```

### 4. Export in index.ts

If you created a new category file, import and spread it in `index.ts`:

```typescript
import { myNewCategory } from './my-new-category'

export const BUILT_IN_TOOLBAR_ACTIONS = {
  ...formattingActions,
  ...navigationActions,
  ...viewActions,
  ...myNewCategory, // Add your new category
}
```

## Action Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the action |
| `icon` | `Component` | ✅ | Icon component from `@kong/icons` |
| `label` | `string` | ✅ | i18n translation key |
| `action` | `string \| function` | ✅ | Monaco command ID or function to execute |
| `keybindings` | `string[]` | ❌ | Keyboard shortcuts (e.g., `['Command', 'B']`) |
| `placement` | `'left' \| 'center' \| 'right'` | ❌ | Toolbar position (default: `'left'`) |
| `order` | `number` | ❌ | Sort order within placement (default: `100`) |
| `group` | `number \| string` | ❌ | Visual grouping (default: `'default'`) |
| `showInContextMenu` | `boolean` | ❌ | Show in right-click menu (default: `false`) |
| `contextMenuGroupId` | `string` | ❌ | Context menu group (default: `'navigation'`) |
| `contextMenuOrder` | `number` | ❌ | Order in context menu (default: `1`) |
| `languages` | `string[]` | ❌ | Languages to show action for (default: all) |

## Helpers

### `createWrapAction(wrapper, actionName)`

Use this helper for text wrapping actions (e.g., bold, italic):

```typescript
import { createWrapAction } from './helpers'

export const formattingActions = {
  bold: {
    id: 'editor.action.bold',
    icon: BoldIcon,
    label: 'editor.labels.action_bold',
    action: createWrapAction('**', 'bold'), // Wraps with **text**
    keybindings: ['Command', 'B'],
    placement: 'left',
    languages: ['markdown', 'mdc'],
  },
}
```

## Tips

- **Group related actions**: Use the same `group` number to visually group actions with separators
- **Order matters**: Lower `order` numbers appear first
- **Language-specific actions**: Use the `languages` array to only show actions for specific file types
- **Reuse helpers**: Check `helpers.ts` for reusable patterns before writing custom logic
- **Keep it modular**: One category per file keeps the codebase maintainable
