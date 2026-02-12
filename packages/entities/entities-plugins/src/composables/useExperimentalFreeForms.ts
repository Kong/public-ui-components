import { inject, provide } from 'vue'
import type { ExperimentalFormName, FreeFormName } from '../utils/free-form'
import { getFreeFormName, shouldUseFreeForm } from '../utils/free-form'
import { EXPERIMENTAL_FREE_FORM_PROVIDER } from '../constants'

export function useExperimentalFreeForms() {
  return inject<ExperimentalFormName[]>(EXPERIMENTAL_FREE_FORM_PROVIDER, [])
}

export function useProvideExperimentalFreeForms(freeForms: ExperimentalFormName[]) {
  provide(EXPERIMENTAL_FREE_FORM_PROVIDER, freeForms)
}

/**
 * Composable that resolves whether a plugin should use free-form rendering.
 * Internalizes the injected experimental whitelist so callers don't need to pass it.
 */
export function useFreeFormResolver() {
  // todo: replace getFreeFormName in useSchema.ts with this composable
  const experimentalFreeForms = useExperimentalFreeForms()

  return {
    shouldUseFreeForm: (pluginName: string, engine?: 'vfg' | 'freeform') =>
      shouldUseFreeForm(pluginName, experimentalFreeForms, engine),

    getFreeFormName: (pluginName: string, engine?: 'vfg' | 'freeform') =>
      getFreeFormName(pluginName as FreeFormName, experimentalFreeForms) || (engine === 'freeform' ? 'CommonForm' : undefined),
  }
}
