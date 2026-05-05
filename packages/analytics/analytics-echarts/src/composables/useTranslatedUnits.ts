import useI18n from './useI18n'

export default function useTranslatedUnits() {
  const { i18n } = useI18n()
  const hasTranslation = i18n.te as (key: string) => boolean
  const translate = i18n.t as (key: string, values?: Record<string, string>) => string

  const translateUnit = (unit: string, rawValue: number) => {
    const singular = rawValue === 1
    const translationKey = `chartUnits.${unit}`

    if (unit === 'usd') {
      return ''
    }

    if (hasTranslation(translationKey)) {
      return translate(translationKey, { plural: singular ? '' : 's' })
    }

    return unit
  }

  return { translateUnit }
}
