export type DebounceFunction = (...args: any[]) => void

export function debounce(fn: DebounceFunction, delay: number) {
  let timeoutId: number
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
