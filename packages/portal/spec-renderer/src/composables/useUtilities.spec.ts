import { describe, it, expect } from 'vitest'
import useUtilities from './useUtilities'

const { getSizeFromString } = useUtilities()

describe('getSizeFromString(): ', () => {
  it('handles numbers', () => {
    const sizeStr = '500'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}px`)
  })

  it('handles auto', () => {
    const sizeStr = 'auto'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}`)
  })

  it('handles percentages', () => {
    const sizeStr = '500%'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}`)
  })

  it('handles vh', () => {
    const sizeStr = '500vh'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}`)
  })

  it('handles vw', () => {
    const sizeStr = '500vw'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}`)
  })

  it('handles px', () => {
    const sizeStr = '500px'
    const result = getSizeFromString(sizeStr)

    expect(result).equal(`${sizeStr}`)
  })
})
