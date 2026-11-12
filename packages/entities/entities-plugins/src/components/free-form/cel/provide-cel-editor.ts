import { computed, markRaw, provide, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import CelInput from './CelInput.vue'
import type { CelSubjects } from './cel-subjects'
import { CEL_CONDITION_KEY, CEL_INPUT_KEY, CEL_SUBJECTS_KEY, CEL_VALIDATE_KEY } from '../../../constants'
import type { CelValidationRequest, CelValidationResult } from '../../../types/plugin-form'

export interface CelEditorOptions {
  /**
   * Renders the Monaco CEL editor for every CEL field below. When false, the
   * fields keep their plain inputs and `CelField` falls back to a textarea.
   * Read once: a feature flag does not flip while a form is open.
   */
  enabled: boolean
  /**
   * Compiles an expression on the Gateway, behind the editor's "Validate"
   * button. The host owns the URL and the client, because the endpoint differs
   * per product. Omitted, there is no button.
   */
  validate?: (request: CelValidationRequest) => Promise<CelValidationResult>
  /**
   * Loads the records a CEL expression can name, for value suggestions. Called
   * when the first editor opens; the result is shared by every editor below.
   * Omitted, the editors work without value suggestions.
   */
  loadSubjects?: () => Promise<CelSubjects>
  /**
   * Whether the `condition` field takes CEL rather than the ATC router syntax.
   * Kong Gateway 3.15 made CEL the condition engine. Defaults to `enabled`.
   */
  conditionIsCel?: MaybeRefOrGetter<boolean>
}

/**
 * Hands the CEL editor to every field below: the plugin `condition`, the
 * `expressions.*` twins, and ACL `allow_when`/`deny_when`.
 *
 * `PluginEntityForm` calls this for the plugin form. A host that renders the
 * free-form pieces itself — AI Manager's policy form — calls it in its own
 * setup, which is the only way those fields get the editor and the Validate
 * button.
 */
export const provideCelEditor = ({ enabled, validate, loadSubjects, conditionIsCel }: CelEditorOptions): void => {
  // `markRaw`: a component is a value here, never something to make reactive.
  if (enabled) provide(CEL_INPUT_KEY, markRaw(CelInput))
  provide(CEL_CONDITION_KEY, computed(() => enabled && (conditionIsCel === undefined || toValue(conditionIsCel))))

  if (validate) provide(CEL_VALIDATE_KEY, validate)

  if (loadSubjects) {
    // One request per form, however many editors ask for it.
    let subjects: Promise<CelSubjects> | undefined
    provide(CEL_SUBJECTS_KEY, () => subjects ??= loadSubjects())
  }
}
