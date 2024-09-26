import { createI18n, i18nTComponent } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

interface UseI18nReturn {
  i18n: ReturnType<typeof createI18n<typeof english>>
  i18nT: ReturnType<typeof i18nTComponent<typeof english>>
}

export default function useI18n(): UseI18nReturn {
  const i18n = createI18n<typeof english>('en-us', english)

  return {
    i18n,
    i18nT: i18nTComponent<typeof english>(i18n), // Translation component <i18n-t>
  }
}
