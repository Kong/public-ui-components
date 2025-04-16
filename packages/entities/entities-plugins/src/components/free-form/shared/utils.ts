export function toSelectItems<T extends string>(
  items: T[],
): { value: T, label: T }[] {
  return items.map((item) => ({ value: item, label: item }))
}

export const path = {
  arraySymbol: '*',
  rootSymbol: '$',
  separator: '.',

  resolve(...args: string[]): string {
    return args.join(path.separator)
  },

  resolveRoot(...args: string[]): string {
    return path.resolve(path.rootSymbol, ...args)
  },

  isAbsolute(p: string): boolean {
    return p.startsWith(path.resolve(path.rootSymbol, ''))
  },

  toArray(p: string): string[] {
    return p.split(path.separator)
  },

  getName(p: string): string {
    const arr = path.toArray(p)
    return arr[arr.length - 1]
  },
}
