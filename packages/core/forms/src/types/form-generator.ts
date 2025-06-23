import type { Slot } from 'vue'

export type FGCollapsibleOptions = boolean | {
  title?: string
  description?: string
  nestedCollapsible?: {
    fields: any[]
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

export interface AutofillSlotProps {
  schema: Record<string, any>
  value: any
  update: (value: any) => void
}

export type AutofillSlot = Slot<AutofillSlotProps>

export type Validator = (value: any, field: any, model: any, messages: Record<string, string>) => string[]
export interface Validators {
  [key: string]: Validator
}
