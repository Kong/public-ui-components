import type { Component } from 'vue'

export interface FormFieldSchema extends Record<string, any> {
  model: string
  type: string
  id?: string
  disabled?: boolean
  inputType?: string
  inputValues?: Record<string, any>
  valueType?: string
  valueArrayType?: string
  default?: any
  fieldClasses?: string
  label?: string
  placeholder?: string
  order?: number
  help?: string
  hint?: string
  submitWhenNull?: boolean
  selectOptions?: Record<string, any>
  component?: Component | null
}

export interface FormSchema {
  fields: FormFieldSchema[]
}
