import composables from '../composables'

export default function useTranslatedUnits() {
  const { i18n } = composables.useI18n()

  const translateUnit = (unit: string, rawValue: number) => {
    const singular = (rawValue === 1)

    const translationKey = `chartUnits.${unit}`

    // @ts-ignore - dynamic i18n key
    if (i18n.te(translationKey)) {
      // @ts-ignore - dynamic i18n key
      return i18n.t(translationKey, { plural: singular ? '' : 's' })
    } else {
      return unit
    }
  }

  return { translateUnit }
}
