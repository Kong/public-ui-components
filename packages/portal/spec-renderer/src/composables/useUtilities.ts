export default function useUtilities() {
  /**
   * Convert a given string to a height with units. If no units are provided, append `px`.
   * @param sizeStr A string that can be used for the height of an element.
   * @returns A string to be used for the height of an element.
   */
  const getSizeFromString = (sizeStr: string): string => {
    return sizeStr === 'auto' || sizeStr.endsWith('%') || sizeStr.endsWith('vw') || sizeStr.endsWith('vh') || sizeStr.endsWith('px') ? sizeStr : sizeStr + 'px'
  }

  /**
   * Check if all of the provided items have a non-falsey value for all of the provided required props
   *
   * @param items The items to validate the prop exists for
   * @param requiredProps An array of all the required prop names
   * @returns Boolean whether or not the items have all the required props
   */
  const hasRequiredProps = (items: object[], requiredProps: string[]): boolean => {
    let isValid = true

    items.forEach((item: object) => {
      requiredProps.forEach((requiredProp: string) => {
        if (!item[requiredProp as keyof typeof item]) {
          isValid = false
        }
      })
    })

    return isValid
  }

  return {
    getSizeFromString,
    hasRequiredProps,
  }
}
