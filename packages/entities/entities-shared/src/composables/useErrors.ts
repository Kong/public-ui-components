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
    if (error?.response?.status === 401) {
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

  /**
 * Receive an error and return the error fields from the payload
 * @param {string|Error|object} error - error string
 * @returns {Object} Object containing message and fields
 */
  const getErrorFieldsFromError = (error: any): { messages: string[], fields: Array<{ field: string, message: string }> } => {
    if (!error) {
      return {
        messages: [t('errors.unexpected')],
        fields: [],
      }
    }

    if (error?.response?.status === 401) {
      return {
        messages: [],
        fields: [],
      }
    }

    let messages: string[] = [t('errors.unexpected')]
    const fields: Array<{ field: string, message: string }> = []

    if (error?.response?.data) {
      if (error.response.data.details?.length) {
        messages = []
        error.response.data.details.forEach((entry: Record<string, any>) => {
          let errorMessage = t('errors.unexpected')

          if (entry.messages && Array.isArray(entry.messages) && entry.messages.length) {
            errorMessage = entry.messages.join(', ')
          }

          if (entry.field) {
            fields.push({ field: entry.field, message: errorMessage })
          }
          messages.push(`${entry.field ?? ''} ${errorMessage}`)
        })
        return { messages, fields }
      }

      if (error.response.data.message && Array.isArray(error.response.data.message)) {
        messages = []
        error.response.data.message.forEach((err: any) => {
          if (err?.constraints) {
            const errorMessage = Object.values(err.constraints).join(', ')
            messages.push(errorMessage)
            if (err.property) {
              fields.push({ field: err.property, message: errorMessage })
            }
          } else if (err?.property && err?.message) {
            fields.push({ field: err.property, message: err.message })
            messages.push(err.message)
          } else {
            messages.push(err)
          }
        })
        return { messages, fields }
      }

      if (typeof error.response.data.message === 'string' || typeof error.response.data === 'string') {
        return {
          messages: [error.response.data.message],
          fields: [],
        }
      }

      if (typeof error.response.data === 'object') {
        messages = []
        Object.keys(error.response.data).forEach(key => {
          fields.push({ field: key, message: error.response.data[key] })
          messages.push(error.response.data[key])
        })
        return { messages, fields }
      }
    }

    return {
      messages: [error.message || t('errors.unexpected')],
      fields: [],
    }
  }

  return {
    getErrorFieldsFromError,
    getMessageFromError,
  }
}
