import { inject, provide } from 'vue'
import { getExperimentalPluginNames, getFreeFormComponent, shouldUseFreeForm } from '../components/free-form/shared/plugin-registry'
import { EXPERIMENTAL_FREE_FORM_PROVIDER } from '../constants'

export function useExperimentalFreeForms() {
  return inject<string[]>(EXPERIMENTAL_FREE_FORM_PROVIDER, [])
}

function validateExperimentalFreeForms(freeForms: string[]): string[] {
  const experimentalPluginNames = new Set(getExperimentalPluginNames())
  const validFreeForms = freeForms.filter(name => experimentalPluginNames.has(name))
  const invalidFreeForms = freeForms.filter(name => !experimentalPluginNames.has(name))

  if (invalidFreeForms.length > 0) {
    console.warn(
      `[entities-plugins] Ignoring unknown experimental free-form plugins: ${invalidFreeForms.join(', ')}`,
    )
  }

  return validFreeForms
}

export function useProvideExperimentalFreeForms(freeForms: string[]) {
  provide(EXPERIMENTAL_FREE_FORM_PROVIDER, validateExperimentalFreeForms(freeForms))
}

/**
 * Composable that resolves whether a plugin should use free-form rendering.
 * Internalizes the injected experimental whitelist so callers don't need to pass it.
 */
export function useFreeFormResolver() {
  const experimentalFreeForms = useExperimentalFreeForms()

  return {
    shouldUseFreeForm: (pluginName: string, engine?: 'vfg' | 'freeform') =>
      shouldUseFreeForm(pluginName, experimentalFreeForms, engine),

    getFreeFormComponent: (pluginName: string) =>
      getFreeFormComponent(pluginName, experimentalFreeForms),
  }
}
