import { describe, expect, it } from 'vitest'
import useHelpers from '../useHelpers'
const { objectsAreEqual } = useHelpers()

describe('objectsAreEqual', () => {
  it('should return true for simple equal objects', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { b: 2, a: 1 }
    expect(objectsAreEqual(obj1, obj2, true)).toBe(true)
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('should return false for different primitive values', () => {
    expect(objectsAreEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('should return true when array order is different', () => {
    const obj1 = { arr: [1, 2, 3] }
    const obj2 = { arr: [3, 1, 2] }
    expect(objectsAreEqual(obj1, obj2, true)).toBe(true)
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('should return false when array values are different', () => {
    const obj1 = { arr: [1, 2, 3] }
    const obj2 = { arr: [1, 2, 4] }
    expect(objectsAreEqual(obj1, obj2, true)).toBe(false)
  })

  it('should return true for nested objects with different array order', () => {
    const obj1 = {
      user: {
        id: 1,
        name: 'Alice',
        roles: ['admin', 'editor'],
        settings: {
          theme: 'dark',
          notifications: [{ type: 'email', enabled: true }, { type: 'sms', enabled: false }],
        },
      },
    }

    const obj2 = {
      user: {
        name: 'Alice',
        id: 1,
        roles: ['editor', 'admin'],
        settings: {
          theme: 'dark',
          notifications: [{ type: 'sms', enabled: false }, { type: 'email', enabled: true }],
        },
      },
    }

    expect(objectsAreEqual(obj1, obj2, true)).toBe(true)
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('should return false if nested objects have different values', () => {
    const obj1 = {
      user: {
        name: 'Alice',
        settings: { theme: 'dark' },
      },
    }
    const obj2 = {
      user: {
        name: 'Alice',
        settings: { theme: 'light' },
      },
    }

    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('should return true for deeply nested arrays with different order', () => {
    const obj1 = { data: [[3, 2, 1], [6, 5, 4]] }
    const obj2 = { data: [[1, 2, 3], [4, 5, 6]] }
    expect(objectsAreEqual(obj1, obj2, true)).toBe(true)
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('complex case with numbers, strings, and deep objects', () => {
    const obj1 = {
      id: 123,
      name: 'Test Object',
      tags: ['alpha', 'beta', 'gamma'],
      metadata: {
        created: '2023-01-01',
        values: [100, 200, 300],
        nested: {
          foo: 'bar',
          arr: [{ key: 'x' }, { key: 'y' }, { key: 'z' }],
        },
      },
    }
    const obj2 = {
      metadata: {
        nested: {
          arr: [{ key: 'z' }, { key: 'x' }, { key: 'y' }],
          foo: 'bar',
        },
        values: [300, 100, 200],
        created: '2023-01-01',
      },
      id: 123,
      name: 'Test Object',
      tags: ['gamma', 'alpha', 'beta'],
    }

    expect(objectsAreEqual(obj1, obj2, true)).toBe(true)
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })

  it('should return false when structures differ', () => {
    const obj1 = { a: [1, 2, 3] }
    const obj2 = { a: { b: 1 } }
    expect(objectsAreEqual(obj1, obj2)).toBe(false)
  })
})
