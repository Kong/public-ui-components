interface Field {
  model?: string
  label: string
  type: string
  values?: string[]
  id?: string
  default?: string,
  placeholder?: string,
  hint?: string,
  inputType?: 'text' | 'number'
}

export interface ItemsSchema {
  type: string,
  default?: object,
  schema: {
    fields: Field[]
  }
}
