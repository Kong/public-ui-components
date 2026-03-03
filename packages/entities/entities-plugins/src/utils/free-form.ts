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
  'rate-limiting': {
    experimental: true,
    component: 'CommonForm',
  },
  'jwt': {
    experimental: true,
    component: 'CommonForm',
  },
  'route-transformer-advanced': {
    experimental: true,
    component: 'CommonForm',
  },
  'request-transformer': {
    experimental: true,
    component: 'CommonForm',
  },
  'basic-auth': {
    experimental: true,
    component: 'CommonForm',
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

/**
 * Determines if a plugin should use the freeform layout.
 *
 * @param pluginName - The name of the plugin
 * @param experimentalWhitelist - List of experimental plugins enabled for freeform
 * @param engine - Optional engine override ('vfg' | 'freeform')
 * @returns true if the plugin should use freeform layout, false otherwise
 */
export function shouldUseFreeForm(
  pluginName: string,
  experimentalWhitelist: ExperimentalFormName[],
  engine?: 'vfg' | 'freeform',
): boolean {
  // If engine is explicitly set, respect that choice
  if (engine) {
    return engine === 'freeform'
  }

  // No engine specified - check the mapping
  return !!getFreeFormName(pluginName as FreeFormName, experimentalWhitelist)
}
