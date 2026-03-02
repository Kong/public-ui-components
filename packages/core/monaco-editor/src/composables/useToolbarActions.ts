import { computed, unref } from 'vue'
import type { Ref } from 'vue'
import { BUILT_IN_TOOLBAR_ACTIONS } from '../actions'
import useI18n from './useI18n'
import type {
  MonacoEditorActionConfig,
  MonacoEditorToolbarOptions,
  ToolbarGroupPlacement,
} from '../types'

const DEFAULT_PLACEMENT: ToolbarGroupPlacement = 'left'
const DEFAULT_ORDER = 100
const DEFAULT_GROUP = 'default'

/**
 * Composable for managing toolbar actions in the Monaco editor.
 * Merges built-in actions with user-defined custom actions and provides
 * grouped commands organized by placement (left, center, right).
 *
 * @param settings - Toolbar configuration (boolean to enable defaults, or object for customization)
 * @param currentLanguage - Current editor language for filtering language-specific actions
 * @returns Object containing computed commands and grouped commands by placement
 */
export function useToolbarActions(settings: boolean | MonacoEditorToolbarOptions, currentLanguage?: Ref<string>) {
  const { i18n } = useI18n()
  const userActions = settings && typeof settings === 'object' ? settings.actions ?? {} : {}

  /**
   * Computed property that builds the complete list of toolbar actions.
   * Combines built-in actions with user-defined custom actions, applying
   * user overrides and translations.
   */
  const commands = computed<MonacoEditorActionConfig[]>(() => {
    const result: MonacoEditorActionConfig[] = []
    const language = unref(currentLanguage)

    // built-in actions (format, search, fullScreen, etc.)
    for (const [key, builtIn] of Object.entries(BUILT_IN_TOOLBAR_ACTIONS)) {
      const userConfig = userActions[key]
      // Skip if user explicitly disabled this built-in action
      if (userConfig === false) continue

      // Skip if action has language restrictions and current language doesn't match
      if (builtIn.languages && language && !builtIn.languages.includes(language)) {
        continue
      }

      // Merge built-in defaults with user overrides, and translate the label
      result.push({
        ...builtIn,
        label: i18n.t(builtIn.label as any),
        ...(typeof userConfig === 'object' ? userConfig : {}),
      })
    }

    // custom user-defined actions
    for (const [key, cfg] of Object.entries(userActions)) {
      // Skip built-in action keys (already processed), disabled actions, and null/undefined
      if (key in BUILT_IN_TOOLBAR_ACTIONS || cfg === false || cfg == null) continue

      // Create base configuration with defaults for custom actions
      const base: MonacoEditorActionConfig = {
        id: key,
        label: typeof cfg === 'object' && cfg.label ? cfg.label : key,
        placement: DEFAULT_PLACEMENT,
        order: DEFAULT_ORDER,
      }

      // Merge user configuration with base defaults
      const merged =
        typeof cfg === 'object'
          ? { ...base, ...cfg }
          : base

      // Only add custom actions that have both an icon and action defined
      if (merged.icon && merged.action) {
        result.push(merged)
      }
    }

    return result
  })

  /**
   * Groups commands by their group identifier for a specific placement.
   * Commands within the same placement are sorted by order, then grouped.
   * Visual separators can be rendered between groups.
   *
   * @param placement - The toolbar placement ('left', 'center', or 'right')
   * @returns Array of command groups, where each group is an array of actions
   */
  function groupCommands(placement: ToolbarGroupPlacement): MonacoEditorActionConfig[][] {
    const groups = new Map<string, MonacoEditorActionConfig[]>()

    // Filter commands for this placement, sort by order, then organize into groups
    commands.value
      .filter(cmd => (cmd.placement ?? DEFAULT_PLACEMENT) === placement)
      .sort((a, b) => (a.order ?? DEFAULT_ORDER) - (b.order ?? DEFAULT_ORDER))
      .forEach(cmd => {
        const key = String(cmd.group ?? DEFAULT_GROUP)
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(cmd)
      })

    return Array.from(groups.values())
  }

  return {
    commands,
    leftGroups: computed(() => groupCommands('left')),
    centerGroups: computed(() => groupCommands('center')),
    rightGroups: computed(() => groupCommands('right')),
  }
}
