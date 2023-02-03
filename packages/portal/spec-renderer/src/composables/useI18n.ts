import { createI18n, Translation } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

export default function usei18n() {
  const i18n = createI18n('en-us', english)

  return {
    i18n,
    i18nT: Translation, // Translation component <i18n-t>
  }
}
