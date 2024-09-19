/**
 * Test if a string is a valid uuid
 * @param {String} str - the string to test
 * @returns {boolean}
 */
export const uuidRegEx = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export function isValidUuid(str: string) {
  if (!str) return false

  return str.length === 36 && new RegExp(`^${uuidRegEx}$`).test(str)
}
