import useI18n from './useI18n'
import usePluginHelpers from './usePluginHelpers'
import { getPluginIconURL, usePluginMetaData } from './usePluginMeta'
import { useSchemas } from './useSchemas'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  getPluginIconURL,
  usePluginMetaData,
  usePluginHelpers,
  useSchemas,
}
