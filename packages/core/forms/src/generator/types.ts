export type FGCollapsibleOptions = boolean | {
  title?: string
  description?: string
  nestedCollapsible?: {
    fields: any[],
    triggerLabel: {
      expand: string
      collapse: string
    }
  }
}

export interface FGSlots {
  beforeContent?: string
  emptyState?: string
}
