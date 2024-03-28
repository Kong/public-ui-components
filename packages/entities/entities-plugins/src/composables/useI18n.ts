import { createI18n, i18nTComponent } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

export type MessageSource = typeof english

export default function useI18n() {
  const i18n = createI18n<MessageSource>('en-us', english)

  return {
    i18n,
    i18nT: i18nTComponent<MessageSource>(i18n), // Translation component <i18n-t>
  }
}
