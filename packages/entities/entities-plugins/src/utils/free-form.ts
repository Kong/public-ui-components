// This file defines a mapping between plugin names and their corresponding free form component names.
// Notice if you don't want a plugin to be automatically rendered with free form, mark it as experimental and provide it(or not) in consuming app.
const mapping = {
  'request-callout': 'RequestCalloutForm',
  'service-protection': {
    experimental: true,
    component: 'ServiceProtectionForm',
  },
  'datakit': 'DatakitForm',
  'ai-mcp-proxy': 'AIMcpProxyForm',
  'jwt-signer': 'CommonForm',
  'upstream-oauth': {
    experimental: true,
    component: 'UpstreamOauthForm',
  },
  'key-auth': {
    experimental: true,
    component: 'KeyAuthForm',
  },
} as const

export type FreeFormName = keyof typeof mapping
export type ExperimentalFormName = ExtractExperimental<typeof mapping>

type ExtractExperimental<T> = {
  [K in keyof T]: T[K] extends { experimental: true } ? K : never
}[keyof T]

export function getFreeFormName(
  modelName: FreeFormName,
  experimentalWhitelist: ExperimentalFormName[],
): string | undefined {
  const res = mapping[modelName]

  if (typeof res === 'string') {
    return res
  }

  if (experimentalWhitelist.includes(modelName as any)) {
    return res.component
  }
}
