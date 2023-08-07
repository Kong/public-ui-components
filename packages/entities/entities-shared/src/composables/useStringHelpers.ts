export default function useHelpers() {
  /**
   * Converts an underscore separated string into title case
   * ex.) 'cool_text' => 'Cool Text'
   *
   * @param str the string to convert
   * @param separator used to split the string on a different delimiter; default is '_'
   * @returns {String} the converted text
   */
  const convertKeyToTitle = (str: string, separator: string = '_'): string => {
    if (!str) {
      return ''
    }

    return str.split(separator).map(i => i.toLowerCase() === 'id'
      ? i.toUpperCase()
      : i.charAt(0).toUpperCase() + i.substring(1)).join(' ')
  }

  return {
    convertKeyToTitle,
  }
}
