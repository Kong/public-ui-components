import useI18n from './useI18n'

/**
 * Provides a collection of validator functions for entity fields.
 * Each validator function returns an error message if the field is invalid, or an empty string if it is valid.
 */
export default function useValidators() {
  const { i18n: { t } } = useI18n()

  const validateUTF8Name = (name:string) =>
    /^[\p{N}\p{L}.\-_~]*$/u.test(name) ? '' : t('validationErrors.utf8Name')

  return {
    utf8Name: validateUTF8Name,
  }
}
