export default function useHelpers() {
  /**
   * propName could be 'rowValue' or 'row'
   *
   * @param propName the prop name
   * @param slotProps the Record
   * @returns the property value or undefined
   */
  const getPropValue = (propName: string, slotProps?: Record<string, any>) => {
    return slotProps?.[propName] || undefined
  }

  return {
    getPropValue,
  }
}
