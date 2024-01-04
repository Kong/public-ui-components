import useI18n from './useI18n'

export default function useErrors() {
  const { i18n: { t } } = useI18n()

  /**
   * Receive an error and return a human readable string.
   * @param {string|Error|object} error - error string
   * @returns string
   */
  const getMessageFromError = (error: any): string => {
    if (!error) {
      return t('errors.unexpected')
    }

    // If the error.status is 401, the user's auth token is expired or missing. We will handle this in the host app by showing a toast notification, etc.
    if (error?.status === 401) {
      console.warn('getMessageFromError: User auth token is expired or missing, returning empty message.')
      return ''
    }

    if (error?.response?.data) {
      if (error.response.data.detail) {
        const message = error.response.data.detail

        return message
      }

      if (error.response.data.details?.length) {
        return error.response.data.details.map((entry: Record<string, any>) => {
          let errors = t('errors.unexpected')

          if (entry.messages && typeof entry.messages === 'object' && entry.messages.length) {
            errors = entry.messages.join(', ')
          }

          if (entry.field) {
            return `${entry.field} - ${errors}`
          }

          return errors
        }).join('; ')
      }

      if (error.response.data.message) {
        const { message } = error.response.data

        if (Array.isArray(message)) {
          if (message[0]?.constraints) {
            return Object.values(message[0].constraints)[0] as string
          } else {
            return message[0]
          }
        }

        return message
      }

      if (typeof error.response.data === 'string') {
        return error.response.data
      }

      if (typeof error.response.data === 'object') {
        return Object.keys(error.response.data)
          .map(key => `${key} ${error.response.data[key]}`)
          .join(', ')
      }
    }

    return error.message || t('errors.unexpected')
  }

  return {
    getMessageFromError,
  }
}
