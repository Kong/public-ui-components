interface PluginSchemaErrorResponseData {
  message?: string
  code?: number
  name?: string
}

interface PluginSchemaErrorResponse {
  status?: number
  data?: PluginSchemaErrorResponseData
}

interface PluginSchemaError {
  response?: PluginSchemaErrorResponse
}

export const isPluginSchemaInUseError = (err: unknown): boolean => {
  const response = (err as PluginSchemaError)?.response

  return response?.status === 400 && (
    response.data?.message?.includes('plugin schema is currently in use') ||
    response.data?.code === 19 ||
    response.data?.name === 'referenced by others'
  )
}
