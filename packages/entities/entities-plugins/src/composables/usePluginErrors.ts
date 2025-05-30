import type { ValidationError } from 'src/components/free-form/shared/types'
import { ref, watch, type Ref } from 'vue'

type pluginFormError = {
  response?: {
    data?: {
      code?: number
      detail?: string
      details?: Array<{
        type?: string
        '@type'?: string
        field?: string
        messages?: string[]
      }>
      message?: string
    }
    status?: number
  }
  message?: string
}

const fieldActivationHandlers = new Map<string, (...args: any[]) => void>()

export const removeFieldActivationHandlers = (prefix: string) => {
  const result = [...fieldActivationHandlers.keys()].filter(
    (key) => key === prefix || key.startsWith(prefix + '.'),
  )
  result.forEach((key) => fieldActivationHandlers.delete(key))
}

export const removeFieldErrors = (prefix: string, index?: number) => {
  if (!fieldValidationErrors.value) {
    return
  }
  if (index === undefined) {
    // remove all errors subfields of the prefix
    const keysToDelete = [...fieldValidationErrors.value!.keys()].filter(
      (key) => key === prefix || key.startsWith(prefix + '.'),
    )
    console.log('result', keysToDelete)
    keysToDelete.forEach((key) => fieldValidationErrors.value!.delete(key))
  } else {
    const deleteKey = `${prefix}.${index}`
    const keysToUpdate: { oldKey: string, newKey: string }[] = []
    // const keysToDelete = [...fieldValidationErrors.value!.keys()].filter(key => key.startsWith(prefix + '.' + index))
    // keysToDelete.forEach(key => fieldValidationErrors.value!.delete(key))
    for (const key of fieldValidationErrors.value!.keys()) {
      if (key === deleteKey || key.startsWith(`${deleteKey}.`)) {
        fieldValidationErrors.value!.delete(key)
      } else {
        const match = key.match(new RegExp(`^${prefix}\\.(\\d+)(.*)`))
        if (match) {
          const num = Number(match[1])
          const suffix = match[2]
          if (num > index) {
            const newKey = `${prefix}.${num - 1}${suffix}`
            keysToUpdate.push({ oldKey: key, newKey })
          }
        }
      }
    }
    for (const { oldKey, newKey } of keysToUpdate) {
      const value = fieldValidationErrors.value!.get(oldKey)!
      fieldValidationErrors.value!.delete(oldKey)
      fieldValidationErrors.value!.set(newKey, value)
    }
  }
}

function buildPaths(parts: string[]): string[] {
  const result: string[] = []
  if (parts.length === 0) {
    return result
  }
  for (let i = 0; i < parts.length; i++) {
    const path = parts.slice(0, i + 1).join('.')
    result.push(path)
  }
  return result
}

function extractTrailingIndex(path: string) {
  const match = path.match(/^(.*?)(?:\[(\d+)\]|\.([0-9]+))$/)
  if (!match) return null
  return {
    prefix: match[1],
    index: Number(match[2] ?? match[3]),
  }
}

export const traversePathAncestors = (fields?: string[]) => {
  if (!fields?.length) {
    return
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const result = extractTrailingIndex(field)
    if (result !== null) {
      const { prefix, index } = result
      fieldActivationHandlers.get(prefix)?.(index)
    } else {
      fieldActivationHandlers.get(field)?.()
    }

  }
}

export const activateField = (field: string) => {
  const fieldPrefixes = field?.split('.')
  const fieldPaths = buildPaths(fieldPrefixes)

  traversePathAncestors(fieldPaths)
}

// const handleKMFieldError = (errorMessage: string) => {
//   const wrapperRegex = /^\d*\s*schema violations?\s*\((.*)\)$/
//   const strippedErrorMessage = errorMessage.replace(wrapperRegex, '$1')

// }

const fieldValidationErrors = ref<ValidationError>()

export const useFieldErrors = (error: Ref<pluginFormError>) => {
  const konnectFieldRegex = /['"]?(config(?:\.[a-zA-Z_]\w*(?:\[\d+\])?)*)['"]?\s*-\s*([^;]+)/g

  watch(error, async (err) => {
    if (!err) {
      console.log('errorMessage is empty', err)
      return
    }
    // console.log(fieldActivationHandlers, fieldActivationHandlers.size)
    // const fieldRegex = /['"]?(test(?:\.(?:[a-zA-Z_]\w*|\[\d+\]))+)['"]?/g
    if (err?.response?.data) {

      // use details if available
      // TODO: check if there are not valid fields
      if (err.response.data.details?.length) {
        const details = err.response.data.details
        fieldValidationErrors.value = details.reduce((acc: ValidationError, entry: Record<string, any>) => {
          if (entry.field) {
            const field = entry.field.replace(/\[(\d+)\]/g, '.$1')
            acc.set(field, { message: entry.messages?.join(', ') })
          }
          return acc
        }, new Map())
        return
      }
      let message = ''

      if (err.response.data.detail && typeof err.response.data.detail === 'string') {
        message = err.response.data.detail
      } else if (err.response.data.message && typeof err.response.data.message === 'string') {
        message = err.response.data.message
      } else if (typeof err.response.data === 'string') {
        message = err.response.data
      } else if (typeof err.response.data === 'object') {
        message = Object.keys(err.response.data)
          .map((key) => `${key} ${(err.response!.data as Record<string, string>)[key]}`)
          .join(', ')
      }

      const errorFields = [...message.matchAll(konnectFieldRegex)].map(
        ([, rawKey, message]) => {
          const key = rawKey.replace(/\[(\d+)\]/g, '.$1')
          return { key, message }
        },
      )
      fieldValidationErrors.value = errorFields.reduce(
        (errors: ValidationError, field) => {
          errors.set(field.key, { message: field.message })
          return errors
        },
        new Map(),
      )
      return
    }

  })
  return {
    fieldValidationErrors,
    fieldActivationHandlers,
  }
}
