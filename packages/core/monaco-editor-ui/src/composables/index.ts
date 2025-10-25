import useI18n from './useI18n'
import useMonacoEditor from './useMonacoEditor'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  useMonacoEditor,
}
