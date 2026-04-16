# Monaco Editor Toolbar Actions

This directory contains all built-in toolbar actions for the Monaco Editor component, organized by category for easy maintenance and extensibility.

## Structure

```
actions/
├── index.ts              # Aggregates all actions and exports helpers
├── helpers.ts            # Reusable utilities for creating actions
├── formatting.ts         # Text formatting actions (bold, italic, format, etc.)
├── insert.ts             # Insert actions (code, link, image)
├── list.ts               # List actions (unordered, ordered, task list)
├── markdownShortcuts.ts  # Markdown keyboard shortcuts (e.g. list continuation on Enter)
├── navigation.ts         # Navigation actions (search, goto, etc.)
└── view.ts               # View-related actions (fullscreen, etc.)
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
  ...insertActions,
  ...listActions,
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

Use this helper for symmetric text wrapping actions (e.g., bold, italic, inline code):

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

### `createInsertAction(prefix, suffix, actionName)`

Use this helper for asymmetric prefix/suffix insert actions (e.g., links, images):

```typescript
import { createInsertAction } from './helpers'

export const insertActions = {
  link: {
    id: 'editor.action.link',
    icon: LinkIcon,
    label: 'editor.labels.action_link',
    action: createInsertAction('[', '](url)', 'link'), // Wraps with [text](url)
    keybindings: ['Command', 'K'],
    placement: 'left',
    languages: ['markdown', 'mdc'],
  },
}
```

### `createLinePrefixAction(prefixOrFn, actionName, detectPrefix?)`

Use this helper for line-prefix toggle actions (e.g., lists). Supports both fixed prefixes and dynamic prefix functions:

```typescript
import { createLinePrefixAction } from './helpers'

export const listActions = {
  // Fixed prefix
  unorderedList: {
    id: 'editor.action.unorderedList',
    icon: ListUnorderedIcon,
    label: 'editor.labels.action_unordered_list',
    action: createLinePrefixAction('- ', 'unorderedList'),
    keybindings: ['Command', 'Shift', 'U'],
    placement: 'left',
    languages: ['markdown', 'mdc'],
  },

  // Dynamic prefix with custom detection regex
  orderedList: {
    id: 'editor.action.orderedList',
    icon: ListOrderedIcon,
    label: 'editor.labels.action_ordered_list',
    action: createLinePrefixAction(
      (i) => `${i}. `,   // 1-based line index
      'orderedList',
      /^\d+\.\s/,        // Custom regex to detect existing prefix
    ),
    keybindings: ['Command', 'Shift', 'O'],
    placement: 'left',
    languages: ['markdown', 'mdc'],
  },
}
```

## Markdown Shortcuts

The `markdownShortcuts.ts` module registers keyboard shortcuts that enhance the markdown editing experience. These are automatically registered for every editor instance and are only active when the editor language is `markdown` or `mdc`.

### List Continuation on Enter

When pressing Enter at the end of a list line, the next line automatically gets the appropriate prefix:

- **Unordered lists**: `- `, `* `, `+ ` → same marker
- **Ordered lists**: `1. ` → `2. ` (auto-incremented)
- **Task lists**: `- [ ] ` or `- [x] ` → `- [ ] ` (unchecked)

Pressing Enter on an **empty** list item (prefix only, no content) removes the prefix, ending the list.

## Tips

- **Group related actions**: Use the same `group` number to visually group actions with separators
- **Order matters**: Lower `order` numbers appear first
- **Language-specific actions**: Use the `languages` array to only show actions for specific file types
- **Reuse helpers**: Check `helpers.ts` for reusable patterns before writing custom logic
- **Keep it modular**: One category per file keeps the codebase maintainable
