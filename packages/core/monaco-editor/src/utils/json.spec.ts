import { describe, expect } from 'vitest'
import { formatJSONKeyPath } from './json'

describe('formatKeyPath', () => {
  it('should format simple key paths', () => {
    expect(formatJSONKeyPath(['user'])).toBe('user')
    expect(formatJSONKeyPath(['user', 'name'])).toBe('user.name')
    expect(formatJSONKeyPath(['users', 0, 'name'])).toBe('users[0].name')
  })

  it('should format key paths with special characters', () => {
    expect(formatJSONKeyPath(['user-data'])).toBe("['user-data']")
    expect(formatJSONKeyPath(['user', 'first-name'])).toBe("user['first-name']")
    expect(formatJSONKeyPath(['data', 'items', 2, 'item-name'])).toBe("data.items[2]['item-name']")
  })

  it('should handle keys with single quotes', () => {
    expect(formatJSONKeyPath(["user's data"])).toBe("['user\\'s data']")
    expect(formatJSONKeyPath(['data', "item's name"])).toBe("data['item\\'s name']")
  })
})
