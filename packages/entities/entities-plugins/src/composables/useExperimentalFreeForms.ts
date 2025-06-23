import { inject, provide } from 'vue'
import type { ExperimentalFormName } from '../utils/free-form'
import { EXPERIMENTAL_FREE_FORM_PROVIDER } from '../constants'

export function useExperimentalFreeForms() {
  return inject<ExperimentalFormName[]>(EXPERIMENTAL_FREE_FORM_PROVIDER, [])
}

export function useProvideExperimentalFreeForms(freeForms: ExperimentalFormName[]) {
  provide(EXPERIMENTAL_FREE_FORM_PROVIDER, freeForms)
}
