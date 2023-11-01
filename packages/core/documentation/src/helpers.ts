export function cloneDeep(a: any) {
  if (a === undefined) { return }

  return JSON.parse(JSON.stringify(a))
}
