import type { InjectionKey, Ref } from 'vue'
import type { CelSubjects } from '../components/free-form/cel/cel-subjects'
import type { CelValidationRequest, CelValidationResult } from '../types/plugin-form'

export { USE_SECRET_INPUT_KEY, FREE_FORM_SCHEMA_MAP_KEY, CEL_INPUT_KEY } from '@kong-ui-public/freeform'
export { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../components/free-form/const'

/**
 * Loads the records that plugin CEL expressions can name, for value suggestions.
 * Called when a CEL editor opens; repeated calls share one request.
 */
export const CEL_SUBJECTS_KEY = Symbol('CEL_SUBJECTS_KEY') as InjectionKey<() => Promise<CelSubjects>>

/**
 * Whether the plugin `condition` field takes CEL. Kong Gateway 3.15 made CEL the
 * condition engine; 3.14 used the ATC router syntax.
 */
export const CEL_CONDITION_KEY = Symbol('CEL_CONDITION_KEY') as InjectionKey<Ref<boolean>>

/**
 * Compiles a CEL expression on the Gateway, for the editor's "Validate" button.
 * Provided only when the host app supplied `validateCelExpression`; without it
 * the button is hidden.
 */
export const CEL_VALIDATE_KEY = Symbol('CEL_VALIDATE_KEY') as InjectionKey<(request: CelValidationRequest) => Promise<CelValidationResult>>

export const FEATURE_FLAGS = {
  KM_2262_CODE_MODE: 'KM-2262-code-mode',
  KM_2306_CONDITION_FIELD_314: 'KM-2306-condition-field-314',
  KM_2446_DATAKIT_JWT_NODES: 'KM-2446-Datakit-JWT-nodes',
  KM_2503_CUSTOM_PLUGIN_FREEFORM: 'KM-2503-custom-plugin-freeform',
  KM_2485_CLONED_PLUGINS: 'KM-2485-cloned-plugins',
  KHCP_20393_IDENTITY_PRINCIPALS_UI: 'khcp-20393-identity-principals-ui',
  KM_3444_GATEWAY_317: 'KM-3444-gateway-317',
  /**
   * The CEL editor for plugin expressions (`condition`, `expressions.*`, ACL
   * `allow_when`/`deny_when`): Monaco with typed suggestions, hints and record
   * values. When off, those fields keep their plain text inputs.
   */
  KM_PLUGINS_CEL_EXPRESSION_EDITOR: 'km-plugins-cel-expression-editor',
}

export const TOASTER_PROVIDER = Symbol('TOASTER_PROVIDER')
