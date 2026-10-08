import { it, describe, expect } from 'vitest'

import useInteractionCoordinator from './useInteractionCoordinator'

describe('useInteractionCoordinator', () => {
  it.each([
    ['activeDimension', 'dimension', 'foo'],
    ['activeDimensionValue', 'dimensionValue', 'foo'],
    ['activeMetric', 'metric', 'foo'],
    ['activeTimestamp', 'timestamp', Date.now()],
  ])('sets "%s" when activate is called with "%s" set', (expectedChange, activateArg, value) => {
    const coordinator = useInteractionCoordinator()

    // @ts-ignore dynamic property access is intended for this test
    expect(coordinator[expectedChange].value).toEqual(null)

    coordinator.activate({ chartUuid: crypto.randomUUID(), [activateArg]: value })

    // @ts-ignore dynamic property access is intended for this test
    expect(coordinator[expectedChange].value).toEqual(value)
  })

  it.each([
    ['activeDimension', 'dimension', 'foo'],
    ['activeDimensionValue', 'dimensionValue', 'foo'],
    ['activeMetric', 'metric', 'foo'],
    ['activeTimestamp', 'timestamp', Date.now()],
  ])('sets all active properties that aren\'t %s to null when just %s is provided', (expectedChange, activateArg, value) => {
    const coordinator = useInteractionCoordinator()

    coordinator.activate({ chartUuid: crypto.randomUUID(), [activateArg]: value })

    const acts = ['activeDimension', 'activeDimensionValue', 'activeMetric', 'activeTimestamp'].filter((act) => act !== expectedChange)

    acts.forEach((act) => {
      // @ts-ignore dynamic property access is intended for this test
      expect(coordinator[act].value).toEqual(null)
    })
  })

  it('sets all active values to null when deactivate is called with a matching chartUuid', () => {
    const coordinator = useInteractionCoordinator()
    const now = Date.now()
    const uuid = crypto.randomUUID()

    coordinator.activate({
      chartUuid: uuid,
      timestamp: now,
      dimension: 'test-dim',
      dimensionValue: 'test-dim-value',
      metric: 'test-metric',
    })

    expect(coordinator.activeChart.value).toBe(uuid)
    expect(coordinator.activeTimestamp.value).toBe(now)
    expect(coordinator.activeDimension.value).toBe('test-dim')
    expect(coordinator.activeDimensionValue.value).toBe('test-dim-value')
    expect(coordinator.activeMetric.value).toBe('test-metric')

    coordinator.deactivate({ chartUuid: uuid })

    expect(coordinator.activeChart.value).toBe(null)
    expect(coordinator.activeTimestamp.value).toBe(null)
    expect(coordinator.activeDimension.value).toBe(null)
    expect(coordinator.activeDimensionValue.value).toBe(null)
    expect(coordinator.activeMetric.value).toBe(null)
  })

  it('leaves all active values as they are when deactivate is called with a non-matching chartUuid', () => {
    const coordinator = useInteractionCoordinator()
    const now = Date.now()
    const uuid = crypto.randomUUID()
    const uuid2 = crypto.randomUUID()

    expect(uuid).not.toBe(uuid2)

    coordinator.activate({
      chartUuid: uuid,
      timestamp: now,
      dimension: 'test-dim',
      dimensionValue: 'test-dim-value',
      metric: 'test-metric',
    })

    expect(coordinator.activeChart.value).toBe(uuid)
    expect(coordinator.activeTimestamp.value).toBe(now)
    expect(coordinator.activeDimension.value).toBe('test-dim')
    expect(coordinator.activeDimensionValue.value).toBe('test-dim-value')
    expect(coordinator.activeMetric.value).toBe('test-metric')

    // when you deactivate, you can't deactivate if you're not the active chart,
    // because it effectively means that by time chart uuid2 is trying to deactivate,
    // some other chart has already called `activate` and we don't want to overwrite
    // that state.
    coordinator.deactivate({ chartUuid: uuid2 })

    expect(coordinator.activeChart.value).toBe(uuid)
    expect(coordinator.activeTimestamp.value).toBe(now)
    expect(coordinator.activeDimension.value).toBe('test-dim')
    expect(coordinator.activeDimensionValue.value).toBe('test-dim-value')
    expect(coordinator.activeMetric.value).toBe('test-metric')
  })
})