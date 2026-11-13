export { USE_SECRET_INPUT_KEY, FREE_FORM_SCHEMA_MAP_KEY } from '@kong-ui-public/freeform'
export { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../components/free-form/const'

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
