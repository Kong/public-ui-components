export function debounce(fn: Function, delay: number) {
  let timeoutId: number
  return (...args: any) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
