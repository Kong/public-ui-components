import type { TopNThresholdType } from '../utils/topn-columns'

export interface TopTalkersTooltipRow {
  key: string
  label: string
  value: string
  threshold?: TopNThresholdType
}

export interface TopTalkersCellData {
  id: string
  name: string
  deleted: boolean
  /** For `____OTHER____` datapoints. */
  isOther: boolean
  /** For `empty` datapoints. */
  isEmpty: boolean
  value: number
  /** Share of the column total from 0 to 1 */
  ratio: number
  /** Background hue, mixed with the page background by `tint`. */
  color: string
  /** Percentage of `color` to mix with the page background, scaled by share, e.g. "35%". */
  tint: string
  /** Formatted size metric, e.g. "2,160". */
  display: string
  /** Formatted share, e.g. "26%". */
  relative: string
  tooltipRows: TopTalkersTooltipRow[]
}

export interface TopTalkersColumnData {
  dimension: string
  label: string
  total: string
  cells: TopTalkersCellData[]
}
