import useCertificate from './useCertificate'
import useI18n from './useI18n'
import useX509 from './x509Helper'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useCertificate,
  useI18n,
  useX509,
}
