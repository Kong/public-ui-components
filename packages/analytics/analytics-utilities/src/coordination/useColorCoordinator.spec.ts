import { beforeEach, describe, expect, it } from 'vitest'
import useColorCoordinator from './useColorCoordinator'
import { color, lightPalette } from './color'
import type { ColorCoordinator } from '../types'

const paletteLength = lightPalette.length

describe('useColorCoordinator()', () => {
  let coordinator: ColorCoordinator

  beforeEach(() => {
    coordinator = useColorCoordinator()
  })

  describe('consistency', () => {
    it('returns the same index for the same name', () => {
      const first = coordinator.resolveDiscriminator({ name: 'a', theme: 'light' })

      expect(coordinator.resolveDiscriminator({ name: 'a', theme: 'light' })).toBe(first)
    })

    it('returns the same index for the same name across charts', () => {
      const first = coordinator.resolveDiscriminator({ name: 'a', chartUuid: 'chart-1', order: 1, theme: 'light' })

      coordinator.resolveDiscriminator({ name: 'b', chartUuid: 'chart-2', order: 1, theme: 'light' })

      expect(coordinator.resolveDiscriminator({ name: 'a', chartUuid: 'chart-2', order: 2, theme: 'light' })).toBe(first)
    })

    it('does not reassign a locked name when order or chart differ', () => {
      const first = coordinator.resolveDiscriminator({ name: 'a', order: 1, chartUuid: 'chart-1', theme: 'light' })

      expect(coordinator.resolveDiscriminator({ name: 'a', order: 5, chartUuid: 'chart-3', theme: 'light' })).toBe(first)
    })
  })

  describe('spreading', () => {
    it('assigns distinct indices to new names until the palette is exhausted', () => {
      const indices = Array.from({ length: paletteLength }, (_, i) =>
        coordinator.resolveDiscriminator({ name: `series-${i}`, theme: 'light' }))

      expect(new Set(indices).size).toBe(paletteLength)
    })

    it('starts at index 0 and breaks ties toward the lowest index', () => {
      expect(coordinator.resolveDiscriminator({ name: 'a', theme: 'light' })).toBe(0)
      expect(coordinator.resolveDiscriminator({ name: 'b', theme: 'light' })).toBe(1)
      expect(coordinator.resolveDiscriminator({ name: 'c', theme: 'light' })).toBe(2)
    })

    it('reuses the least-used indices once the palette wraps', () => {
      for (let i = 0; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `series-${i}`, theme: 'light' })
      }

      // Every index has been used once; the next ties break to the lowest.
      expect(coordinator.resolveDiscriminator({ name: 'extra-1', theme: 'light' })).toBe(0)
      expect(coordinator.resolveDiscriminator({ name: 'extra-2', theme: 'light' })).toBe(1)
    })

    it('is deterministic for the same sequence of calls', () => {
      const run = () => {
        const c = useColorCoordinator()
        return ['a', 'b', 'c', 'd'].map((name, i) => c.resolveDiscriminator({ name, order: i + 1, chartUuid: 'chart', theme: 'light' }))
      }

      expect(run()).toEqual(run())
    })
  })

  describe('adjacency', () => {
    it('avoids the color of the directly preceding series in the same chart', () => {
      // Skew usage so index 0 is the least-used color; without adjacency
      // avoidance, the next new name would land on it.
      const first = coordinator.resolveDiscriminator({ name: 'a', order: 1, chartUuid: 'chart-1', theme: 'light' })
      // 'a' => 0. Fill the remaining indices once so that index 0 and 1 tie again after wrap.
      for (let i = 1; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `fill-${i}`, chartUuid: 'filler', theme: 'light' })
      }

      // All indices have usage 1. 'a' is the previous series (order 1) in chart-1.
      // The next series (order 2) would tie-break to 0, but must avoid it.
      const next = coordinator.resolveDiscriminator({ name: 'b', order: 2, chartUuid: 'chart-1', theme: 'light' })

      expect(first).toBe(0)
      expect(next).not.toBe(first)
    })

    it('does not treat non-consecutive orders as adjacent', () => {
      coordinator.resolveDiscriminator({ name: 'a', order: 1, chartUuid: 'chart-1', theme: 'light' })
      for (let i = 1; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `fill-${i}`, chartUuid: 'filler', theme: 'light' })
      }

      // Order 3 does not directly follow order 1, so index 0 is still eligible.
      expect(coordinator.resolveDiscriminator({ name: 'c', order: 3, chartUuid: 'chart-1', theme: 'light' })).toBe(0)
    })

    it('does not apply adjacency when order is omitted', () => {
      coordinator.resolveDiscriminator({ name: 'a', chartUuid: 'chart-1', theme: 'light' })
      for (let i = 1; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `fill-${i}`, chartUuid: 'filler', theme: 'light' })
      }

      expect(coordinator.resolveDiscriminator({ name: 'b', chartUuid: 'chart-1', theme: 'light' })).toBe(0)
    })

    it('tracks adjacency per chart so interleaved charts do not cause false adjacency', () => {
      coordinator.resolveDiscriminator({ name: 'a', order: 1, chartUuid: 'chart-1', theme: 'light' })
      for (let i = 1; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `fill-${i}`, chartUuid: 'filler', theme: 'light' })
      }
      // A resolve in another chart must not overwrite chart-1's tracked neighbor...
      coordinator.resolveDiscriminator({ name: 'other', order: 1, chartUuid: 'chart-2', theme: 'light' })

      // ...so chart-1's next series still avoids index 0.
      expect(coordinator.resolveDiscriminator({ name: 'b', order: 2, chartUuid: 'chart-1', theme: 'light' })).not.toBe(0)
    })

    it('uses a shared bucket for calls without a chartUuid', () => {
      coordinator.resolveDiscriminator({ name: 'a', order: 1, theme: 'light' })
      for (let i = 1; i < paletteLength; i++) {
        coordinator.resolveDiscriminator({ name: `fill-${i}`, chartUuid: 'filler', theme: 'light' })
      }

      expect(coordinator.resolveDiscriminator({ name: 'b', order: 2, theme: 'light' })).not.toBe(0)
    })

    it('keeps inherited collisions when an earlier chart already locked the name', () => {
      // chart-1 locks 'x' => 0 and 'y' => 1.
      coordinator.resolveDiscriminator({ name: 'x', order: 1, chartUuid: 'chart-1', theme: 'light' })
      coordinator.resolveDiscriminator({ name: 'y', order: 2, chartUuid: 'chart-1', theme: 'light' })

      // chart-2 sees them in the opposite order; locked values are not changed.
      expect(coordinator.resolveDiscriminator({ name: 'y', order: 1, chartUuid: 'chart-2', theme: 'light' })).toBe(1)
      expect(coordinator.resolveDiscriminator({ name: 'x', order: 2, chartUuid: 'chart-2', theme: 'light' })).toBe(0)
    })
  })

  describe('reset()', () => {
    it('clears locked assignments', () => {
      coordinator.resolveDiscriminator({ name: 'a', theme: 'light' })
      coordinator.resolveDiscriminator({ name: 'b', theme: 'light' })

      coordinator.reset()

      // 'b' was 1; after reset a new name starts from index 0 again.
      expect(coordinator.resolveDiscriminator({ name: 'b', theme: 'light' })).toBe(0)
    })

    it('clears per-chart adjacency tracking', () => {
      coordinator.resolveDiscriminator({ name: 'a', order: 1, chartUuid: 'chart-1', theme: 'light' })
      coordinator.reset()

      // Without the reset, order 2 would avoid the previous index (0).
      expect(coordinator.resolveDiscriminator({ name: 'b', order: 2, chartUuid: 'chart-1', theme: 'light' })).toBe(0)
    })

    it('clears usage counts', () => {
      for (let i = 0; i < 3; i++) {
        coordinator.resolveDiscriminator({ name: `series-${i}`, theme: 'light' })
      }
      coordinator.reset()

      expect(coordinator.resolveDiscriminator({ name: 'fresh', theme: 'light' })).toBe(0)
    })
  })

  describe('integration with color()', () => {
    it('resolves the same color for the same series across charts', () => {
      const args = { dimension: 'service', dimensionValue: 'abc', metric: 'request_count', coordinator }

      expect(color({ ...args, chartUuid: 'chart-1', order: 1 })).toBe(color({ ...args, chartUuid: 'chart-2', order: 4 }))
    })

    it('gives distinct colors to the first series up to the palette length', () => {
      const colors = Array.from({ length: paletteLength }, (_, i) =>
        color({ dimension: 'service', dimensionValue: `v${i}`, coordinator, chartUuid: 'chart', order: i + 1 }))

      expect(new Set(colors).size).toBe(paletteLength)
    })

    it('does not consult the coordinator for an explicit discriminator', () => {
      const result = color({ discriminator: 2, dimension: 'service', dimensionValue: 'abc', coordinator })

      expect(result).toBe(lightPalette[2])
      // Nothing was locked, so a new name still gets index 0.
      expect(coordinator.resolveDiscriminator({ name: 'new', theme: 'light' })).toBe(0)
    })

    it('does not consult the coordinator for override colors', () => {
      color({ dimension: 'status_code', dimensionValue: '200', coordinator })
      color({ dimensionValue: 'empty', coordinator })

      expect(coordinator.resolveDiscriminator({ name: 'new', theme: 'light' })).toBe(0)
    })
  })
})
