import { describe, it, expect } from 'vitest'
import { debounce } from './'

describe('debounce', () => {
  it('should debounce a function', async () => {
    let counter = 0
    const increment = () => {
      counter++
    }
    const debouncedIncrement = debounce(increment, 100)

    debouncedIncrement()
    debouncedIncrement()
    debouncedIncrement()

    expect(counter).toBe(0)

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(counter).toBe(1)
  })

  it('should pass arguments to the debounced function', async () => {
    let result = 0
    const add = (a: number, b: number) => {
      result = a + b
    }
    const debouncedAdd = debounce(add, 100)

    debouncedAdd(2, 3)
    debouncedAdd(4, 5)

    expect(result).toBe(0)

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(result).toBe(9)
  })
})
