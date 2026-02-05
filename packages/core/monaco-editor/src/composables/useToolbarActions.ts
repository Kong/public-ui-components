import { computed } from 'vue'
import { BUILT_IN_TOOLBAR_ACTIONS } from '../constants/toolbar-actions'
import type { MonacoEditorActionConfig, MonacoEditorToolbarOptions, ToolbarGroupPlacement } from '../types'

const DEFAULT_PLACEMENT: ToolbarGroupPlacement = 'left'
const DEFAULT_ORDER = 100

/**
 * Composable for processing and organizing toolbar actions
 */
export function useToolbarActions(
  settings: boolean | MonacoEditorToolbarOptions,
  i18n: (key: string, ...args: any[]) => string,
) {
  /**
   * Process and merge user commands with built-in commands
   */
  const commands = computed<MonacoEditorActionConfig[]>(() => {
    const result: MonacoEditorActionConfig[] = []

    // If settings is true, show all built-in commands
    // If settings is an object, use the actions configuration
    const userCommands = settings === true ? {} : (typeof settings === 'object' ? settings?.actions || {} : {})

    // Process built-in commands
    for (const key in BUILT_IN_TOOLBAR_ACTIONS) {
      const userConfig = userCommands[key]
      if (userConfig === false) continue // disabled by user

      const builtIn = BUILT_IN_TOOLBAR_ACTIONS[key]
      const merged: MonacoEditorActionConfig = {
        ...builtIn,
        label: i18n(builtIn.labelKey),
        ...(typeof userConfig === 'object' ? userConfig : {}),
      }

      result.push(merged)
    }

    // Process custom user commands
    for (const key in userCommands) {
      if (key in BUILT_IN_TOOLBAR_ACTIONS) continue // already processed
      const cfg = userCommands[key]
      if (cfg === false || cfg === undefined) continue

      const commandConfig: MonacoEditorActionConfig = typeof cfg === 'object' ? {
        id: key,
        label: cfg.label || key,
        icon: cfg.icon,
        action: cfg.action,
        keybindings: cfg.keybindings,
        placement: cfg.placement || DEFAULT_PLACEMENT,
        order: cfg.order ?? DEFAULT_ORDER,
        group: cfg.group,
      } : {
        id: key,
        label: key,
        placement: DEFAULT_PLACEMENT,
        order: DEFAULT_ORDER,
      } as MonacoEditorActionConfig

      if (commandConfig.icon && commandConfig.action) {
        result.push(commandConfig)
      }
    }

    return result
  })

  /**
   * Group commands by placement and then by group
   */
  const groupCommands = (placement: ToolbarGroupPlacement): MonacoEditorActionConfig[][] => {
    const placementCommands = commands.value
      .filter(cmd => (cmd.placement || 'left') === placement)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

    if (placementCommands.length === 0) return []

    // Group by group identifier
    const grouped = new Map<string | number, MonacoEditorActionConfig[]>()

    placementCommands.forEach(cmd => {
      const groupKey = cmd.group !== undefined ? String(cmd.group) : 'default'
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, [])
      }
      grouped.get(groupKey)!.push(cmd)
    })

    return Array.from(grouped.values())
  }

  const leftGroups = computed<MonacoEditorActionConfig[][]>(() => groupCommands('left'))
  const centerGroups = computed<MonacoEditorActionConfig[][]>(() => groupCommands('center'))
  const rightGroups = computed<MonacoEditorActionConfig[][]>(() => groupCommands('right'))

  return {
    commands,
    leftGroups,
    centerGroups,
    rightGroups,
  }
}
