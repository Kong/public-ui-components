import {
  KUI_COLOR_BACKGROUND_PRIMARY,
  KUI_METHOD_COLOR_TEXT_TRACE,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_METHOD_COLOR_TEXT_PATCH,
  KUI_SPACE_40,
  KUI_SPACE_50,
} from '@kong/design-tokens'
import type { WaterfallLegendItem } from '../types'

// Vue provide/inject keys
export const WATERFALL_CONFIG = Symbol('WaterfallConfig')
export const WATERFALL_ROWS_STATE = Symbol('WaterfallRowsState')

export const WATERFALL_SPAN_BAR_FADING_WIDTH = KUI_SPACE_50
export const WATERFALL_ROW_LABEL_WIDTH = '400px'
export const WATERFALL_ROW_COLUMN_GAP = KUI_SPACE_40
export const WATERFALL_ROW_PADDING_X = KUI_SPACE_40

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
