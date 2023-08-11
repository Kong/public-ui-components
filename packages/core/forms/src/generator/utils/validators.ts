import { defaults, isNil, isNumber, isInteger, isString, isArray, isFunction, isFinite } from 'lodash'
import fecha from 'fecha'

const resources = {
  fieldIsRequired: 'This field is required!',
  invalidFormat: 'Invalid format!',

  numberTooSmall: 'The number is too small! Minimum: {0}',
  numberTooBig: 'The number is too big! Maximum: {0}',
  invalidNumber: 'Invalid number',
  invalidInteger: 'The value is not an integer',

  textTooSmall: 'The length of text is too small! Current: {0}, Minimum: {1}',
  textTooBig: 'The length of text is too big! Current: {0}, Maximum: {1}',
  thisNotText: 'This is not a text!',

  thisNotArray: 'This is not an array!',

  selectMinItems: 'Select minimum {0} items!',
  selectMaxItems: 'Select maximum {0} items!',

  invalidDate: 'Invalid date!',
  dateIsEarly: 'The date is too early! Current: {0}, Minimum: {1}',
  dateIsLate: 'The date is too late! Current: {0}, Maximum: {1}',

  invalidEmail: 'Invalid e-mail address!',
  invalidURL: 'Invalid URL!',

  invalidCard: 'Invalid card format!',
  invalidCardNumber: 'Invalid card number!',

  invalidTextContainNumber: 'Invalid text! Cannot contains numbers or special characters',
  invalidTextContainSpec: 'Invalid text! Cannot contains special characters',
}

function checkEmpty(value: any, required: any, messages = resources) {
  if (isNil(value) || value === '') {
    if (required) {
      return [msg(messages.fieldIsRequired)]
    } else {
      return []
    }
  }
  return null
}

function msg(text: any, ...args: any) {
  if (text != null && args.length > 0) {
    for (let i = 0; i < args.length; i++) {
      text = text.replace('{' + (i - 1) + '}', args[i])
    }
  }

  return text
}

export const validators: any = {
  resources,

  required(value: any, field: any, model: any, messages = resources) {
    return checkEmpty(value, field.required, messages)
  },

  number(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const err = []
    if (isFinite(value)) {
      if (!isNil(field.min) && value < field.min) {
        // @ts-ignore
        err.push(msg(messages.numberTooSmall, field.min))
      }

      if (!isNil(field.max) && value > field.max) {
        // @ts-ignore
        err.push(msg(messages.numberTooBig, field.max))
      }
    } else {
      err.push(msg(messages.invalidNumber))
    }

    return err
  },

  integer(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res
    const errs = validators.number(value, field, model, messages)

    if (!isInteger(value)) {
      errs.push(msg(messages.invalidInteger))
    }

    return errs
  },

  double(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    if (!isNumber(value) || isNaN(value)) {
      return [msg(messages.invalidNumber)]
    }
  },

  string(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const err = []
    if (isString(value)) {
      if (!isNil(field.min) && value.length < field.min) {
        // @ts-ignore
        err.push(msg(messages.textTooSmall, value.length, field.min))
      }

      if (!isNil(field.max) && value.length > field.max) {
        // @ts-ignore
        err.push(msg(messages.textTooBig, value.length, field.max))
      }
    } else {
      err.push(msg(messages.thisNotText))
    }

    return err
  },

  array(value: any, field: any, model: any, messages = resources) {
    if (field.required) {
      if (!isArray(value)) {
        return [msg(messages.thisNotArray)]
      }

      if (value.length === 0) {
        return [msg(messages.fieldIsRequired)]
      }
    }

    if (!isNil(value)) {
      if (!isNil(field.min) && value.length < field.min) {
        // @ts-ignore
        return [msg(messages.selectMinItems, field.min)]
      }

      if (!isNil(field.max) && value.length > field.max) {
        // @ts-ignore
        return [msg(messages.selectMaxItems, field.max)]
      }
    }
  },

  date(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const m = new Date(value)
    if (isNaN(m.getDate())) {
      return [msg(messages.invalidDate)]
    }

    const err = []

    if (!isNil(field.min)) {
      const min = new Date(field.min)
      if (m.valueOf() < min.valueOf()) {
        // @ts-ignore
        err.push(msg(messages.dateIsEarly, fecha.format(m), fecha.format(min)))
      }
    }

    if (!isNil(field.max)) {
      const max = new Date(field.max)
      if (m.valueOf() > max.valueOf()) {
        // @ts-ignore
        err.push(msg(messages.dateIsLate, fecha.format(m), fecha.format(max)))
      }
    }

    return err
  },

  regexp(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    if (!isNil(field.pattern)) {
      const re = new RegExp(field.pattern)
      if (!re.test(value)) {
        return [msg(messages.invalidFormat)]
      }
    }
  },

  email(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line no-useless-escape
    if (!re.test(value)) {
      return [msg(messages.invalidEmail)]
    }
  },

  url(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g // eslint-disable-line no-useless-escape
    if (!re.test(value)) {
      return [msg(messages.invalidURL)]
    }
  },

  creditCard(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    /*  From validator.js code
      https://github.com/chriso/validator.js/blob/master/src/lib/isCreditCard.js
    */
    const creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
    const sanitized = value.replace(/[^0-9]+/g, '')
    if (!creditCard.test(sanitized)) {
      return [msg(messages.invalidCard)]
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
      return [msg(messages.invalidCardNumber)]
    }
  },

  alpha(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const re = /^[a-zA-Z]*$/
    if (!re.test(value)) {
      return [msg(messages.invalidTextContainNumber)]
    }
  },

  alphaNumeric(value: any, field: any, model: any, messages = resources) {
    const res = checkEmpty(value, field.required, messages)
    if (res != null) return res

    const re = /^[a-zA-Z0-9]*$/
    if (!re.test(value)) {
      return [msg(messages.invalidTextContainSpec)]
    }
  },
}

Object.keys(validators).forEach(name => {
  const fn = validators[name]
  if (isFunction(fn)) {
    // @ts-ignore
    fn.locale = customMessages => (value, field, model) => fn(value, field, model, defaults(customMessages, resources))
  }
})

export default validators
