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
  /**
   * Set when the host field is disabled (e.g. by freeform's version
   * compatibility check) — the autofill/vault-picker UI should not be
   * interactive while this is true.
   */
  disabled?: boolean
}

export type AutofillSlot = Slot<AutofillSlotProps>

export type Validator = (value: any, field: any, model: any, messages: Record<string, string>) => string[]
export interface Validators {
  [key: string]: Validator
}
