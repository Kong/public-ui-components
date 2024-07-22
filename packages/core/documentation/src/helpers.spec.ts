import { describe, it, expect } from 'vitest'
import * as helpers from './helpers'

describe('Helpers', () => {
  describe('Application Helpers', () => {
    describe('isObjectEmpty()', () => {
      it('should return true if object is empty and false otherwise', () => {
        const obj1 = {}
        const obj2 = { one: 1 }

        expect(helpers.isObjectEmpty(obj1)).toBe(true)
        expect(helpers.isObjectEmpty(obj2)).toBe(false)
      })
    })
  })
})
