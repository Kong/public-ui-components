import type { ComponentPublicInstance } from 'vue'

export interface ErrorCallbackParams {
  error: unknown
  instance: ComponentPublicInstance | null
  componentName?: string
  info: string
  tags: string[]
}

export interface ErrorBoundaryPluginOptions {
  name?: string
  onError?: ({ error, instance, componentName, info, tags }: ErrorCallbackParams) => void
}
