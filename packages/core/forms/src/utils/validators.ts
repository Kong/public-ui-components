import { createI18n } from '@kong-ui-public/i18n'
import type { Validators } from '../types/form-generator'
import fecha from 'fecha'
import defaults from 'lodash-es/defaults'
import isFinite from 'lodash-es/isFinite'
import isFunction from 'lodash-es/isFunction'
import isInteger from 'lodash-es/isInteger'
import isString from 'lodash-es/isString'
import isNil from 'lodash-es/isNil'
import isNumber from 'lodash-es/isNumber'
import english from '../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)

const resources: Record<string, string> = {
  fieldIsRequired: t('validators.field_is_required'),
  invalidFormat: t('validators.invalid_format'),

  numberTooSmall: t('validators.number_too_small'),
  numberTooBig: t('validators.number_too_large'),
  invalidNumber: t('validators.invalid_number'),
  invalidInteger: t('validators.invalid_integer'),

  textTooSmall: t('validators.text_too_short'),
  textTooBig: t('validators.text_too_long'),
  thisNotText: t('validators.this_not_text'),

  thisNotArray: t('validators.this_not_array'),

  selectMinItems: t('validators.select_min_items'),
  selectMaxItems: t('validators.select_max_items'),

  invalidDate: t('validators.invalid_date'),
  dateIsEarly: t('validators.date_is_early'),
  dateIsLate: t('validators.date_is_late'),

  invalidEmail: t('validators.invalid_email'),
  invalidURL: t('validators.invalid_url'),

  invalidCard: t('validators.invalid_card'),
  invalidCardNumber: t('validators.invalid_card_number'),

  invalidTextContainNumber: t('validators.invalid_text_contain_number'),
  invalidTextContainSpec: t('validators.invalid_tex_contain_spec'),
} as const

// string substitution for user passed custom messages.
const msg = (text: string, ...args: any[]): string => {
  if (text && args.length > 0) {
    for (let i = 0; i < args.length; i++) {
      text = text.replace('{' + (i - 1) + '}', String(args[i] || ''))
    }
  }

  return text
}

// Safely get a message from the messages object, falling back to resources if not found.
const getMsg = (messages: Record<string, string>, key: keyof typeof resources): string => {
  return messages[key] ?? resources[key] ?? ''
}

/**
 * Check emptiness of a value and return error message if the field is required.
 *
 * @param value The value to check
 * @param required Whether or not the field is required
 * @param messages Error message resources
 * @returns If the value is not empty, return null, otherwise return an array (with error message if field is required)
 */
const checkEmpty = (value: any, required: boolean, messages = resources) => {
  if (isNil(value) || value === '') {
    if (required) {
      return [msg(getMsg(messages, 'fieldIsRequired'))]
    } else {
      return []
    }
  }

  return null
}

export const validators: Validators = {
  required: (value: any, field: any, model: any, messages = resources) => {
    return checkEmpty(value, field.required, messages) || []
  },

  number: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    let errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs
    errs = []

    // real/valid number check
    if (isFinite(value)) {
      // min/max check
      if (!isNil(field.min) && value < field.min, messages = resources) {
        errs.push(msg(getMsg(messages, 'numberTooSmall'), field.min))
      }

      if (!isNil(field.max) && value > field.max, messages = resources) {
        errs.push(msg(getMsg(messages, 'numberTooBig'), field.max))
      }
    } else {
      errs.push(msg(getMsg(messages, 'invalidNumber')))
    }

    return errs
  },

  integer: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    let errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs
    errs = []

    if (typeof validators.number === 'function') {
      errs = errs.concat(validators.number(value, field, model, messages) ?? [])
    }

    if (!isInteger(value)) {
      errs.push(msg(getMsg(messages, 'invalidInteger')))
    }

    return errs
  },

  double: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    if (!isNumber(value) || isNaN(value)) {
      return [msg(getMsg(messages, 'invalidNumber'))]
    }

    return []
  },

  string: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    let errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs
    errs = []

    if (isString(value)) {
      // min/max length check
      if (!isNil(field.min) && value.length < field.min) {
        errs.push(msg(getMsg(messages, 'textTooSmall'), value.length, field.min))
      }

      if (!isNil(field.max) && value.length > field.max) {
        errs.push(msg(getMsg(messages, 'textTooBig'), value.length, field.max))
      }
    } else {
      errs.push(msg(getMsg(messages, 'thisNotText')))
    }

    return errs
  },

  array: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    if (field.required) {
      if (!Array.isArray(value)) {
        return [msg(getMsg(messages, 'thisNotArray'))]
      }

      if (value.length === 0) {
        return [msg(getMsg(messages, 'fieldIsRequired'))]
      }
    }

    // min/max items check
    if (!isNil(value)) {
      if (!isNil(field.min) && value.length < field.min) {
        return [msg(getMsg(messages, 'selectMinItems'), field.min)]
      }

      if (!isNil(field.max) && value.length > field.max) {
        return [msg(getMsg(messages, 'selectMaxItems'), field.max)]
      }
    }

    return []
  },

  date: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    let errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs
    errs = []

    // valid date check
    const dateVal = new Date(value)
    if (isNaN(dateVal.getDate())) {
      return [msg(getMsg(messages, 'invalidDate'))]
    }

    // min/max check
    if (!isNil(field.min)) {
      const min = new Date(field.min)
      if (dateVal.valueOf() < min.valueOf()) {
        errs.push(msg(getMsg(messages, 'dateIsEarly'), fecha.format(dateVal), fecha.format(min)))
      }
    }

    if (!isNil(field.max)) {
      const max = new Date(field.max)
      if (dateVal.valueOf() > max.valueOf()) {
        errs.push(msg(getMsg(messages, 'dateIsLate'), fecha.format(dateVal), fecha.format(max)))
      }
    }

    return errs
  },

  regexp: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    // regex pattern check
    if (!isNil(field.pattern)) {
      const re = new RegExp(field.pattern)

      if (!re.test(value)) {
        return [msg(getMsg(messages, 'invalidFormat'))]
      }
    }

    return []
  },

  email: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    // email regex check
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line no-useless-escape
    if (!re.test(value)) {
      return [msg(getMsg(messages, 'invalidEmail'))]
    }

    return []
  },

  url: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    // url regex check
    const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g // eslint-disable-line no-useless-escape
    if (!re.test(value)) {
      return [msg(getMsg(messages, 'invalidURL'))]
    }

    return []
  },

  creditCard: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    /**
     * From validator.js code
     * https://github.com/chriso/validator.js/blob/master/src/lib/isCreditCard.js
     */
    const creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
    const sanitized = value.replace(/[^0-9]+/g, '') // remove all non-digits

    // credit card regex check
    if (!creditCard.test(sanitized)) {
      return [msg(getMsg(messages, 'invalidCard'))]
    }

    let sum = 0
    let digit
    let tmpNum
    let shouldDouble

    for (let i = sanitized.length - 1; i >= 0; i--) {
      digit = sanitized.substring(i, i + 1)
      tmpNum = parseInt(digit, 10)

      if (shouldDouble) {
        tmpNum *= 2

        if (tmpNum >= 10) {
          sum += tmpNum % 10 + 1
        } else {
          sum += tmpNum
        }
      } else {
        sum += tmpNum
      }

      shouldDouble = !shouldDouble
    }

    if (!(sum % 10 === 0 ? sanitized : false)) {
      return [msg(getMsg(messages, 'invalidCardNumber'))]
    }

    return []
  },

  alpha: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    // letters only regex check
    const re = /^[a-zA-Z]*$/
    if (!re.test(value)) {
      return [msg(getMsg(messages, 'invalidTextContainNumber'))]
    }

    return []
  },

  alphaNumeric: (value: any, field: any, model: any, messages = resources) => {
    // requiredness check
    const errs = checkEmpty(value, field.required, messages)
    if (errs != null) return errs

    // letters and numbers only regex check
    const re = /^[a-zA-Z0-9]*$/
    if (!re.test(value)) {
      return [msg(getMsg(messages, 'invalidTextContainSpec'))]
    }

    return []
  },
}

Object.keys(validators).forEach((name: keyof typeof validators) => {
  const fn = validators[name]
  if (isFunction(fn)) {
    // @ts-ignore: allow custom
    fn.locale = customMessages => (value, field, model) => fn(value, field, model, defaults(customMessages, resources))
  }
})
