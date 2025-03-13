export function toSelectItems<T extends string>(
  items: T[],
): { value: T; label: T }[] {
  return items.map((item) => ({ value: item, label: item }))
}
