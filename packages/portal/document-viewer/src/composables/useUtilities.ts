export default function useUtilities() {
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
    hasRequiredProps,
  }
}
