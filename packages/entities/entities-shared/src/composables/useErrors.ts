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
  const getErrorFieldsFromError = (error: any): { message: string; fields: Array<{ field: string; message: string }> } => {
    if (!error) {
      return {
        message: t('errors.unexpected'),
        fields: [],
      }
    }

    // If the error.status is 401, the user's auth token is expired or missing. We will handle this in the host app by showing a toast notification, etc.
    if (error?.response?.status === 401) {
      console.warn('getErrorFieldsFromError: User auth token is expired or missing, returning empty message.')
      return {
        message: '',
        fields: [],
      }
    }

    let message = t('errors.unexpected')
    const fields: Array<{ field: string; message: string }> = []

    if (error?.response?.data) {
    // Handle detailed error with specific field information
      if (error.response.data.details?.length) {
        message = ''
        error.response.data.details.forEach((entry: Record<string, any>) => {
          let errorMessage = t('errors.unexpected')

          if (entry.messages && typeof entry.messages === 'object' && entry.messages.length) {
            errorMessage = entry.messages.join(', ')
          }

          if (entry.field) {
            fields.push({ field: entry.field, message: errorMessage })
          } else if (!message) {
            message = errorMessage
          }
        })

        // If we have field errors but no general message, create a summary
        if (!message && fields.length > 0) {
          message = `Validation errors found in ${fields.length} field(s)`
        }

        return { message, fields }
      }

      // Handle API response with error constraints
      if (error.response.data.message && Array.isArray(error.response.data.message)) {
        const errorMessages = error.response.data.message

        // Handle validation constraints style errors
        if (errorMessages[0]?.constraints) {
          message = Object.values(errorMessages[0].constraints)[0] as string

          // If we have property information, add to fields
          if (errorMessages[0].property) {
            fields.push({
              field: errorMessages[0].property,
              message,
            })
          }
        } else if (errorMessages[0]?.property && errorMessages[0]?.message) {
        // Handle property/message style errors
          errorMessages.forEach((err: any) => {
            fields.push({
              field: err.property,
              message: err.message,
            })
          })
          message = fields.length > 0 ? `Validation errors found in ${fields.length} field(s)` : errorMessages[0].message
        } else {
        // Simple array of error messages
          message = errorMessages[0]
        }

        return { message, fields }
      }

      // Handle simple message object
      if (error.response.data.message && typeof error.response.data.message === 'string') {
        return {
          message: error.response.data.message,
          fields: [],
        }
      }

      // Handle direct string response
      if (typeof error.response.data === 'string') {
        return {
          message: error.response.data,
          fields: [],
        }
      }

      // Handle object with field-specific errors
      if (typeof error.response.data === 'object') {
        Object.keys(error.response.data).forEach(key => {
          fields.push({
            field: key,
            message: error.response.data[key],
          })
        })

        if (fields.length > 0) {
          message = `Validation errors found in ${fields.length} field(s)`
        }

        return { message, fields }
      }
    }

    // Fallback to error message or default
    return {
      message: error.message || t('errors.unexpected'),
      fields: [],
    }
  }

  return {
    getErrorFieldsFromError,
    getMessageFromError,
  }
}
