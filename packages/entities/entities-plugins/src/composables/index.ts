import useI18n from './useI18n'
import usePluginConfigEditor from './usePluginConfigEditor'
import usePluginHelpers from './usePluginHelpers'
import { usePluginMetaData } from './usePluginMeta'
import { useSchemas } from './useSchemas'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  usePluginMetaData,
  usePluginHelpers,
  useSchemas,
  usePluginConfigEditor,
}
