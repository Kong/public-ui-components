import { validateLabelKey, validateLabelValue } from '@kong/entity-labels'
import composables from './composables'

import type { Ref } from 'vue'
import type { Label } from './types'

const { i18n } = composables.useI18n()

export const isAnyInvalidLabels = (tmpLabels: Ref): boolean => {
  if (!tmpLabels.value.length) {
    return false
  }

  if (tmpLabels.value.length === 1 && !tmpLabels.value[0].key && !tmpLabels.value[0].value) {
    return false
  }

  const { labels, isExistDuplicateKey } = checkDuplicateKeys(tmpLabels.value)

  if (!isExistDuplicateKey) {
    tmpLabels.value = tmpLabels.value.map((label: Label) => {
      const validateKey = validateLabelKey(label.key)
      const validateValue = validateLabelValue(label.value)

      return {
        ...label,
        errors: {
          key: validateKey,
          value: validateValue,
        },
      }
    })
  } else {
    tmpLabels.value = labels
  }

  return Boolean(tmpLabels.value.filter((label: Label) => {
    if (label.errors) {
      const { key, value } = label.errors

      return !key?.isValid || !value?.isValid
    }

    return false
  }).length)
}

const checkDuplicateKeys = (labels: Label[]): { labels: Label[], isExistDuplicateKey: boolean } => {
  const uniqueKeys = new Set()

  const labelsWithErrors = labels
    .map(label => {
      if (!uniqueKeys.has(label.key)) {
        uniqueKeys.add(label.key)

        return {
          ...label,
          errors: {
            ...label.errors,
            key: {
              isValid: true,
            },
            value: {
              isValid: true,
            },
          },
        }
      }

      return {
        ...label,
        errors: {
          ...label.errors,
          key: {
            isValid: false,
            failureMessage: i18n.t('label_modal.error_text_for_duplicate_keys'),
          },
          value: {
            isValid: true,
          },
        },
      }
    })

  const isExistDuplicateKey = uniqueKeys.size < labels.length

  uniqueKeys.clear()

  return {
    labels: labelsWithErrors,
    isExistDuplicateKey,
  }
}
