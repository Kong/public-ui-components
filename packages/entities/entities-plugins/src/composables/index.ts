import useI18n from './useI18n'
import usePluginHelpers from './usePluginHelpers'
import { usePluginMetaData } from './usePluginMeta'
import { usePluginSelect } from './usePluginSelect'
import { useSchemas } from './useSchemas'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  usePluginMetaData,
  usePluginSelect,
  usePluginHelpers,
  useSchemas,
}
