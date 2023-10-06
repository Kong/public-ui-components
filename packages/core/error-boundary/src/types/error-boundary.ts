export interface ErrorBoundaryContext {
  componentName: string
  info: string
  source: string
  tags: string[]
}

export interface ErrorBoundaryCallbackParams {
  error: unknown
  context: ErrorBoundaryContext
}

export interface ErrorBoundaryPluginOptions {
  name?: string
  onError?: ({ error, context: { componentName, info, source, tags } }: ErrorBoundaryCallbackParams) => void
}
