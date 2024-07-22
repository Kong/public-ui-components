export interface ErrorBoundaryContext {
  componentName: string
  dataTestid: string
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
  onError?: ({ error, context: { componentName, dataTestid, info, source, tags } }: ErrorBoundaryCallbackParams) => void
}
