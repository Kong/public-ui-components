import type { ComponentPublicInstance } from 'vue'

type ComponentPublicInstanceConstructor = {
  new (...args: any[]): ComponentPublicInstance<any>
}

export type PropType<T extends ComponentPublicInstanceConstructor> =
  InstanceType<T>['$props'] & { [key: string]: unknown }


export type FormConfig = {
  prepareFormData?: (data: any) => any
  transformLabel?: (label: string, fieldPath: string) => string
}
