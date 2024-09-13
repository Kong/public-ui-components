import {
  KUI_COLOR_BACKGROUND_PRIMARY,
  KUI_COLOR_BACKGROUND_PRIMARY_WEAK,
  KUI_COLOR_BACKGROUND_PRIMARY_WEAKER,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_SPACE_50,
} from '@kong/design-tokens'
import type { WaterfallLegendItem } from '../types'

// Vue provide/inject keys
export const WATERFALL_CONFIG = Symbol('WaterfallConfig')
export const WATERFALL_ROWS_STATE = Symbol('WaterfallRowsState')

export const WATERFALL_SPAN_BAR_FADING_WIDTH = KUI_SPACE_50

/**
 * The state of the rows in the waterfall view
 */
export enum WaterfallRowsState {
  /** All rows are collapsed */
  COLLAPSED = 'collapsed',
  /** All rows are expanded */
  EXPANDED = 'expanded',
  /** User has manually collapsed/expanded some rows */
  OVERRIDDEN = 'overridden',
}

// TODO: This is INDETERMINATE now
export enum WaterfallLegendItemKind {
  ROOT = 'root',
  KONG = 'kong',
  UPSTREAM = 'upstream',
  THIRD_PARTY = 'third_party',
  CLIENT = 'client',
}

// TODO: Reserved for span color-coding.
// They are subject to change in the future.
export const WATERFALL_LEGENDS = {
  [WaterfallLegendItemKind.ROOT]: {
    color: KUI_COLOR_BACKGROUND_PRIMARY,
  },
  [WaterfallLegendItemKind.KONG]: {
    color: KUI_COLOR_BACKGROUND_PRIMARY_WEAKER,
  },
  [WaterfallLegendItemKind.UPSTREAM]: {
    color: KUI_COLOR_BACKGROUND_PRIMARY_WEAK,
  },
  [WaterfallLegendItemKind.THIRD_PARTY]: {
    color: KUI_COLOR_TEXT_DECORATIVE_AQUA,
  },
  [WaterfallLegendItemKind.CLIENT]:  {
    color: KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  },
} satisfies Record<WaterfallLegendItemKind, WaterfallLegendItem>

