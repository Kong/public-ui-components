export function cloneDeep(a: any) {
  if (a === undefined) { return }

  return JSON.parse(JSON.stringify(a))
}

/**
 * A method to easily check if an object is empty or not
 * @param {Object} obj object to check
 * @return {Boolean}
 */
export function isObjectEmpty(obj: Record<string, any>) {
  return Object.keys(obj).length === 0
}
