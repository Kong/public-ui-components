import { describe, it, expect } from 'vitest'
import { compare } from 'compare-versions'
import composables from '..'

const { useGatewayFeatureSupported } = composables

// To verify `compare-versions` correctly returns true/false when just doing version comparisons
describe('compare-versions', () => {
  it('correctly returns true', () => {
    expect(compare('2.8', '2.9', '<')).toBe(true)
    expect(compare('2.8.0.0', '3.0', '<')).toBe(true)
    expect(compare('3.0.0.0', '3.0', '<=')).toBe(true)
    expect(compare('3.1.0.0', '3.2', '<')).toBe(true)
  })

  it('correctly returns false', () => {
    expect(compare('2.8', '2.9', '>=')).toBe(false)
    expect(compare('2.8.0.0', '3.0', '>')).toBe(false)
    expect(compare('3.0.0.0', '3.0', '>')).toBe(false)
    expect(compare('3.1.0.0', '3.2', '>')).toBe(false)
  })
})

describe('useGatewayFeatureSupported', () => {
  it('returns true when `gatewayInfo` is omitted', () => {
    const supported = useGatewayFeatureSupported({
      supportedRange: {
        enterprise: ['2.8', '3.4'],
        community: ['2.8', '3.4'],
      },
    })

    expect(supported).toBe(true)
  })

  const editions: Array<'enterprise' | 'community'> = ['enterprise', 'community']
  editions.forEach((edition) => {
    describe(edition, () => {
      it('returns true if in supported range', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.1.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(true)
      })

      it('returns true if equal to minimum supported version', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '2.8.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(true)
      })

      it('returns true if equal to maximum supported version', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.4.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(true)
      })

      it('returns true if minimum version omitted', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '2.8.0.0',
          },
          supportedRange: {
            enterprise: [undefined, '3.4'],
            community: [undefined, '3.4'],
          },
        })

        expect(supported).toBe(true)
      })

      it('returns true if maximum version omitted', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.1.0.0',
          },
          supportedRange: {
            enterprise: ['2.8'],
            community: ['2.8'],
          },
        })

        expect(supported).toBe(true)
      })

      it(`returns false if ${edition} edition is not supported`, () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.1.0.0',
          },
          supportedRange: edition === 'enterprise'
            ? { community: ['2.8', '3.4'] }
            : { enterprise: ['2.8', '3.4'] },
        })

        expect(supported).toBe(false)
      })

      it('returns false if less than minimum', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '2.7.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(false)
      })

      it('returns false if greater than maximum', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.5.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(false)
      })

      it('returns false with invalid version', () => {
        const supported = useGatewayFeatureSupported({
          gatewayInfo: {
            edition,
            version: '3.1.0.0.0',
          },
          supportedRange: {
            enterprise: ['2.8', '3.4'],
            community: ['2.8', '3.4'],
          },
        })

        expect(supported).toBe(false)
      })
    })
  })
})
