import * as url from 'url'

/**
 * @description Capitalize a string.
 * @param {string} str
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * @description Checks whether the given string has symbols.
 * @param {string} str
 */
const hasSymbols = (str: string) => {
  return /[!"#%&'()*+,./:;<=>?@[\\\]^`{|}]/u.exec(str) // without " ", "$", "-" and "_"
}

/**
 * @description Convert text to PascalCase
 * @param {string} str Text to be converted
 * @return {string} Converted string
 */
export const pascalCase = (str: string): string => {
  return capitalize(camelCase(kebabCase(str)))
}

/**
 * @description Convert text to camelCase
 * @param {string} str Text to be converted
 * @return {string} Converted string
 */
export const camelCase = (str: string): string => {
  if (isPascalCase(str)) {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }
  return str.replace(/[-_](\w)/gu, (_, c) => (c ? c.toUpperCase() : ''))
}

/**
 * @description Checks whether the given string is PascalCase.
 * @param {string} str
 */
export const isPascalCase = (str: string): boolean => {
  if (
    hasSymbols(str) ||
    /^[a-z]/u.exec(str) ||
    /-|_|\s/u.exec(str) // kebab or snake or space
  ) {
    return false
  }
  return true
}

/**
 * @description Transform a given string into a lowercase, kebab-case version of the string.
 * @param {string} str - The string to kebab-case.
 * @return {string} Lowercase and kebab-case version of the input string.
 */
export const kebabCase = (str: string): string => {
  if (!str || str.trim() === '') {
    return ''
  }

  return str.trim().replace(/ /g, '-').replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase()).replace(/--+/g, '-').replace(/-+$/g, '')
}

/**
 * @description Get the path (from root) to the new package in the /packages/${workspace}/ directory
 * @param {string} workspace workspace name
 * @param {string} name kebab-case package name
 * @return {string} Path to the new package source files
 */
export const packagePath = (workspace: string, name: string): string => {
  return url.fileURLToPath(new URL(`../../../../${workspace}/${kebabCase(name)}`, import.meta.url))
}

/**
 * @description Get the path (from root) to the cli/src/__template__ directory
 * @return {string} Path to the cli/src/__template__ directory
 */
export const packageTemplatePath = (): string => {
  return url.fileURLToPath(new URL('../../../../core/cli/src/__template__', import.meta.url))
}
