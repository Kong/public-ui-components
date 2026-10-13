export interface AboutCardRow {
  /**
   * Unique key for the row. Also used to build the per-row slot names:
   * `label-${key}` and `row-${key}`.
   */
  key: string
  /** Label text. Ignored when the `label-${key}` slot is provided. */
  label?: string
  /** Informational tooltip rendered next to the label. */
  tooltip?: string
  /** Value text. Ignored when the `row-${key}` slot is provided. */
  value?: string
}

export interface AboutCardProps {
  /** Card title */
  title?: string
  /** HTML element the title is rendered as */
  titleTag?: 'div' | 'p' | 'span' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  /** Description rendered above the rows */
  description?: string
  /** The label/value rows */
  rows?: AboutCardRow[]
  /** Render skeleton placeholders instead of the rows */
  isLoading?: boolean
}

export interface AboutCardSlots {
  /** Content rendered below the rows */
  default?(): any
  /** Card title */
  title?(): any
  /** Description rendered above the rows */
  description?(): any
  /** Action elements rendered to the right of the card title */
  actions?(): any
  /** Overrides the label of the row with the matching key */
  [key: `label-${string}`]: (props: { row: AboutCardRow }) => any
  /** Overrides the value of the row with the matching key */
  [key: `row-${string}`]: (props: { row: AboutCardRow }) => any
}
