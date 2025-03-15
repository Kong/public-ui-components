import isEqual from 'lodash.isequal'
import isPlainObject from 'lodash.isplainobject'
import sortBy from 'lodash.sortby'

export default function useHelpers() {
  /**
   * propName could be 'rowValue' or 'row'
   *
   * @param propName the prop name
   * @param slotProps the Record
   * @returns the property value or undefined
   */
  const getPropValue = (propName: string, slotProps?: Record<string, any>) => {
    return slotProps?.[propName] ?? undefined
  }

  const deepSort = (obj: Record<string, any>): Record<string, any> => {
    if (Array.isArray(obj)) {
      return sortBy(obj.map(deepSort), (item: any) => JSON.stringify(item))
    } else if (isPlainObject(obj)) {
      const sortedObj: Record<string, any> = {}
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          sortedObj[key] = deepSort(obj[key])
        })
      return sortedObj
    } else {
      return obj
    }
  }

  const deepEqualIgnoreOrder = (obj1: Record<string, any>, obj2: Record<string, any>) => {
    return isEqual(deepSort(obj1), deepSort(obj2))
  }

  /**
   * Check if 2 objects are equal
   * @param {Object} a first object to compare
   * @param {Object} b second object to compare
   * @param {Boolean} ignoreOrder whether or not to ignore the order of the objects
   * @returns {Boolean} whether or not the objects are equal
   */
  const objectsAreEqual = (a: Record<string, any>, b: Record<string, any>, ignoreOrder?: boolean): boolean => {
    if (ignoreOrder) {
      return deepEqualIgnoreOrder(a, b)
    }

    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch (e) {
      return false
    }
  }

  /**
   * A comparator function that given a key, compares object values with that key, and returns the results of
   * localCompare on those values (see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare for reference)
   * Also checks for undefined, nulls and sub-Arrays.
   * @param {String} property the key to sort on
   * @returns {Function} a comparator function
   */
  const sortAlpha = (property: string) => {
    return (a: Record<string, any>, b: Record<string, any>) => {
      let propertyA = a[property] === undefined || a[property] === null ? '' : a[property]
      let propertyB = b[property] === undefined || b[property] === null ? '' : b[property]

      if (Array.isArray(a[property])) {
        propertyA = a[property][0]
      }

      if (Array.isArray(b[property])) {
        propertyB = b[property][0]
      }

      return propertyA.localeCompare(propertyB)
    }
  }

  /**
   * Check if a string is a valid uuid
   * @param {String} str - the string to check
   * @returns {boolean}
   */
  const isValidUuid = (str: string) => {
    if (!str) return false

    return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(str)
  }

  return {
    getPropValue,
    objectsAreEqual,
    sortAlpha,
    isValidUuid,
  }
}
