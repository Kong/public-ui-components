import { describe, it, expect } from 'vitest'

import { djb2 } from './djb2'

describe('djb2', () => {
  it('hashes 20 random uuids into positive integers', () => {
    for (let i = 0; i < 20; i++) {
      const result = djb2(crypto.randomUUID())
      expect(result).toBeGreaterThanOrEqual(0)
    }
  })

  it('hashes an empty string into a positive integer', () => {
    const result = djb2('')
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('hashes the same string into the same value each time', () => {
    const original = djb2('test')
    const result = djb2('test')
    expect(result).toEqual(original)
  })

  it('handles any unicode character', () => {
    const neatoBurrito = 'n̷̢̢̧̨͍͕̗͍͈̞̝̜̭͚͚̍͛̀̌̅̎̂̾͐͛e̸̪̲̍̑̐̑͑̄͜͠a̶͖̬̹̙̋́͂͊͌́̄̚͝͝t̸̛̳̠̺̥̰̼͔̯̑̂̈̎́o̷͈̣̤̪̓͊̐̾̅́̈́̓̽̋̒͐͒ͅ ̴̦̒̃̓̌̊̽̓̀̍̒̓b̵̢̡͕̝̻͇̝͙̠̐̃̆̈́̂̇̽̎̅̈́̆͐͜͠ų̷̡̢̹̦͍̤͖͍͔̝́̆̍̓ŗ̷̞̥̬̪͖̱̘̜̳̥̬̘̩̟̪̌̇́̿͂ṟ̶̣̂̇͊̌̔͑̀̈͆͆̈́̐̎͘͝͝i̵̧̢̧̧̨̢̲̱̠͎̱̩̤̍̑̑̉͒͛̈́̅̄̈́͗̋̔̆̀̈̕͝t̴͚̔͗̄͋͋͑̂̎̈́̈́̕o'
    const result = djb2(neatoBurrito)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})
