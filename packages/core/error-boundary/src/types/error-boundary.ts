export interface ErrorCallbackParams {
  error: unknown
  tags: string[]
}

export interface ErrorBoundaryPluginOptions {
  name?: string
  onError?: ({ error, tags }: ErrorCallbackParams) => void
}
