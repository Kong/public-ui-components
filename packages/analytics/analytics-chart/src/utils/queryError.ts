import type { QueryError } from '../types'

import composables from '../composables'

export const handleQueryError = (error: any): QueryError => {
  const { i18n } = composables.useI18n()

  if (error?.status === 403) {
    return {
      status: error.status,
      type: 'forbidden',
      message: i18n.t('query_errors.forbidden.message'),
      details: i18n.t('query_errors.forbidden.details'),
    }
  } else if (error?.status === 408) {
    return {
      status: error.status,
      type: 'timeout',
      message: i18n.t('query_errors.timeout.message'),
      details: i18n.t('query_errors.timeout.details'),
    }
  } else if (error?.response?.data?.message === 'Range not allowed for this tier') {
    return {
      status: error.status,
      type: 'range_exceeded',
      message: i18n.t('query_errors.time_range_exceeded.message'),
      details: i18n.t('query_errors.time_range_exceeded.details'),
    }
  } else {
    return {
      status: error.status,
      type: 'other',
      message: error.response?.data?.invalid_parameters?.map((e: any) => e.reason).join(', ') || error?.message,
    }
  }
}
