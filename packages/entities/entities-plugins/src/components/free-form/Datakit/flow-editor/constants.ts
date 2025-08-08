import type { AutoLayoutOptions } from './composables/useFlow'

export const AUTO_LAYOUT_DEFAULT_OPTIONS = {
  padding: 80,
  nodeGap: 40,
  edgeGap: 80,
  rankGap: 80,
} as const satisfies Pick<AutoLayoutOptions, 'padding' | 'nodeGap' | 'edgeGap' | 'rankGap'>
