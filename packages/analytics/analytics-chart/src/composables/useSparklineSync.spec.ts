import useSparklineSync from './useSparklineSync'
import type { SparklineDataset, SparklineType } from '../types'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

describe('useSparklineSync', () => {
  let groupIdA = ''
  let groupIdB = ''

  beforeEach(() => {
    groupIdA = crypto.randomUUID()
    groupIdB = crypto.randomUUID()
  })

  const DEFAULT_RENDER_POINTS = 24

  const use = ({
    datasets = [],
    chartKey = undefined,
    groupKey = undefined,
    minStamp = undefined,
    maxStamp = undefined,
    minCount = undefined,
    maxCount = undefined,
    renderPoints = undefined,
    type = 'sparkline_bar',
  }: {
    datasets?: SparklineDataset[]
    chartKey?: string
    groupKey?: string
    minStamp?: number
    maxStamp?: number
    minCount?: number
    maxCount?: number
    renderPoints?: number
    type?: SparklineType
  } = {}) => {
    let result: ReturnType<typeof useSparklineSync>

    const wrapper = mount(defineComponent({
      setup() {
        result = useSparklineSync({
          datasets,
          type,
          chartKey,
          groupKey,
          minStamp,
          maxStamp,
          minCount,
          maxCount,
          renderPoints,
        })
        return () => h('div')
      },
    }))

    return {
      wrapper,
      // @ts-ignore result is actually defined syncronously but that can't be inferred by typescript
      ...result,
    }
  }

  it('removes state on unmount', () => {
    const {
      wrapper: aWrap,
      syncedRenderPoints: aRenderPoints,
    } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 10 })
    const {
      wrapper: bWrap,
      syncedRenderPoints: bRenderPoints,
    } = use({ chartKey: 'b', groupKey: groupIdA, renderPoints: 15 })

    expect(aRenderPoints.value).toEqual(15)
    expect(bRenderPoints.value).toEqual(15)

    bWrap.unmount()

    // the largest renderPoint contributer was unmounted so no longer affects things
    expect(aRenderPoints.value).toEqual(10)
    expect(bRenderPoints.value).toEqual(10) // irrelevant as b has been unmounted

    aWrap.unmount()

    // both were unmounted, so it just uses defaults now
    expect(aRenderPoints.value).toEqual(DEFAULT_RENDER_POINTS) // irrelevant as a has been unmounted
    expect(bRenderPoints.value).toEqual(DEFAULT_RENDER_POINTS) // irrelevant as b has been unmounted
  })

  describe('syncedRenderPoints', () => {
    it('sets a default value when renderPoints not provided', async () => {
      const { syncedRenderPoints } = use()
      expect(syncedRenderPoints.value).toBe(DEFAULT_RENDER_POINTS)
    })

    it('forced to be 2 or greater', async () => {
      const { syncedRenderPoints } = use({ renderPoints: 0 })
      expect(syncedRenderPoints.value).toBe(2)
    })

    it('using the same chartKey overwrites previous values', async () => {
      const { syncedRenderPoints: a } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 15 })
      expect(a.value).toBe(15)

      const { syncedRenderPoints: b } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 10 })
      expect(b.value).toBe(10)
      expect(a.value).toBe(10)
    })

    it('syncs when multiple sparklines set renderPoints', async () => {
      const { syncedRenderPoints: a } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 15 })
      expect(a.value).toBe(15)

      const { syncedRenderPoints: b } = use({ chartKey: 'b', groupKey: groupIdA, renderPoints: 30 })
      expect(b.value).toBe(30)
      expect(a.value).toBe(30)
    })

    it('prefers assigned values over default', async () => {
      const { syncedRenderPoints: a } = use({ chartKey: 'a', groupKey: groupIdA })
      expect(a.value).toBe(DEFAULT_RENDER_POINTS)

      const { syncedRenderPoints: b } = use({ chartKey: 'b', groupKey: groupIdA, renderPoints: 20 })
      expect(b.value).toBe(20)
      expect(a.value).toBe(20)
    })
  })

  describe('syncedMinStamp and syncedMaxStamp', () => {
    it('calculates from a single unsorted dataset', () => {
      const datasets:SparklineDataset[] = [{ label: 'a', timestamps: [2, 1, 4, 3] }]

      const { syncedMinStamp, syncedMaxStamp } = use({ datasets })

      expect(syncedMinStamp.value).toBe(1)
      expect(syncedMaxStamp.value).toBe(4)
    })

    it('prefers assigned values over default', async () => {
      const datasets:SparklineDataset[] = [{ label: 'a', timestamps: [2, 1, 4, 3] }]

      const { syncedMinStamp, syncedMaxStamp } = use({
        datasets,
        minStamp: 2,
        maxStamp: 3,
      })

      expect(syncedMinStamp.value).toBe(2)
      expect(syncedMaxStamp.value).toBe(3)
    })

    it('calculates from multiple unsorted datasets', () => {
      const datasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2, 2, 4, 3] },
        { label: 'b', timestamps: [4, 3, 1, 3] },
      ]

      const { syncedMinStamp, syncedMaxStamp } = use({ datasets })

      expect(syncedMinStamp.value).toBe(1)
      expect(syncedMaxStamp.value).toBe(4)
    })

    it('syncs from multiple unsorted datasets from multiple charts', () => {
      const aDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2, 2, 4, 3] },
        { label: 'b', timestamps: [4, 3, 1, 3] },
      ]

      const bDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [5] },
        { label: 'b', timestamps: [6, 10, 7, 8] },
      ]

      const { syncedMinStamp: aMin, syncedMaxStamp: aMax } = use({ chartKey: 'a', groupKey: groupIdA, datasets: aDatasets })
      // because the state doesn't know about the bDatasets yet
      expect(aMin.value).toBe(1)
      expect(aMax.value).toBe(4)

      const { syncedMinStamp: bMin, syncedMaxStamp: bMax } = use({ chartKey: 'b', groupKey: groupIdA, datasets: bDatasets })
      // because the state already knows about the aDatasets
      expect(bMin.value).toBe(1)
      expect(bMax.value).toBe(10)

      // now the state knows about both a and b datasets
      expect(aMin.value).toBe(1)
      expect(aMax.value).toBe(10)
    })

    it('syncs uniquely for each groupKey', () => {
      const aDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2, 2, 4, 3] },
        { label: 'b', timestamps: [4, 3, 2, 3] },
      ]

      const bDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [5] },
        { label: 'b', timestamps: [6, 10, 7, 8] },
      ]

      const cDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [5] },
        { label: 'b', timestamps: [6, 9, 7, 8] },
      ]

      const { syncedMinStamp: abMin, syncedMaxStamp: abMax } = use({ chartKey: 'a', groupKey: groupIdB, datasets: cDatasets })
      expect(abMin.value).toBe(5)
      expect(abMax.value).toBe(9)

      const { syncedMinStamp: aMin, syncedMaxStamp: aMax } = use({ chartKey: 'a', groupKey: groupIdA, datasets: aDatasets })
      const { syncedMinStamp: bMin, syncedMaxStamp: bMax } = use({ chartKey: 'b', groupKey: groupIdA, datasets: bDatasets })
      expect(aMin.value).toBe(2)
      expect(bMin.value).toBe(2)
      expect(aMax.value).toBe(10)
      expect(bMax.value).toBe(10)

      // the groupB datasets has not been affected by groupA datasets
      expect(abMin.value).toBe(5)
      expect(abMax.value).toBe(9)
    })

    it('syncs correctly when one dataset is empty', () => {
      const aDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [] },
        { label: 'b', timestamps: [] },
      ]

      const bDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [5] },
        { label: 'b', timestamps: [6, 10, 7, 8] },
      ]

      const { syncedMinStamp: aMin, syncedMaxStamp: aMax } = use({ chartKey: 'a', groupKey: groupIdA, datasets: aDatasets })
      // because the state doesn't know about the bDatasets yet
      expect(aMin.value).toBe(0)
      expect(aMax.value).toBe(0)

      const { syncedMinStamp: bMin, syncedMaxStamp: bMax } = use({ chartKey: 'b', groupKey: groupIdA, datasets: bDatasets })
      expect(bMin.value).toBe(5)
      expect(bMax.value).toBe(10)

      // now the state knows about both a and b datasets
      expect(aMin.value).toBe(5)
      expect(aMax.value).toBe(10)
    })
  })

  describe('syncedGroupSizeMs', () => {
    it('handles empty values', async () => {
      const { syncedRenderPoints, syncedGroupSizeMs } = use()
      expect(syncedRenderPoints.value).toBe(DEFAULT_RENDER_POINTS)
      expect(syncedGroupSizeMs.value).toBe(0) // there are no timestamps
    })

    it('calculates from a single unsorted dataset', () => {
      const datasets:SparklineDataset[] = [{ label: 'a', timestamps: [1001, 1002, 1000, 1003, 1004, 6000] }]
      const { syncedRenderPoints, syncedGroupSizeMs } = use({ renderPoints: 5, datasets })
      expect(syncedRenderPoints.value).toBe(5)
      expect(syncedGroupSizeMs.value).toBe(1000) // (max stamp - min stamp) / render points
    })

    it('calculates from multiple unsorted datasets', () => {
      const datasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2000, 2000, 3000, 4000, 5000, 6000] },
        { label: 'b', timestamps: [5000, 1002, 1000, 1003, 1004, 6000] },
      ]
      const { syncedRenderPoints, syncedGroupSizeMs } = use({ renderPoints: 5, datasets })
      expect(syncedRenderPoints.value).toBe(5)
      expect(syncedGroupSizeMs.value).toBe(1000) // (max stamp - min stamp) / render points
    })

    it('syncs from multiple unsorted datasets from multiple charts', () => {
      const aDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2000, 2000, 1000] },
        { label: 'b', timestamps: [2000, 2000, 2000] },
      ]
      const bDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [9000, 10000] },
        { label: 'b', timestamps: [10000, 49000] },
      ]
      const { syncedGroupSizeMs: aGroupSizeMs } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 3, datasets: aDatasets })
      expect(aGroupSizeMs.value).toBe(334) // ciels when the value isn't divisible by renderPoints

      const { syncedGroupSizeMs: bGroupSizeMs } = use({ chartKey: 'b', groupKey: groupIdA, renderPoints: 3, datasets: bDatasets })
      expect(bGroupSizeMs.value).toBe(16000)
      expect(aGroupSizeMs.value).toBe(16000) // now it's synced
    })

    it('syncs uniquely for each groupKey', () => {
      const aDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [2000, 2000, 1000] },
        { label: 'b', timestamps: [2000, 2000, 2000] },
      ]
      const bDatasets:SparklineDataset[] = [
        { label: 'a', timestamps: [9000, 10000] },
        { label: 'b', timestamps: [10000, 49000] },
      ]
      const { syncedGroupSizeMs: aGroupSizeMs } = use({ chartKey: 'a', groupKey: groupIdA, renderPoints: 3, datasets: aDatasets })
      expect(aGroupSizeMs.value).toBe(334)

      const { syncedGroupSizeMs: bGroupSizeMs } = use({ chartKey: 'b', groupKey: groupIdB, renderPoints: 3, datasets: bDatasets })
      expect(bGroupSizeMs.value).toBe(13334)
      expect(aGroupSizeMs.value).toBe(334) // not synced as it's a different group
    })
  })

  describe('syncedMinCount and syncedMaxCount', () => {
    it('handles empty values', async () => {
      const { syncedMinCount, syncedMaxCount } = use()
      expect(syncedMinCount.value).toBe(0) // there are no timestamps
      expect(syncedMaxCount.value).toBe(0) // there are no timestamps
    })

    it('calculates from a single simple unsorted dataset', () => {
      const datasets:SparklineDataset[] = [{ label: 'a', timestamps: [1, 3, 2, 4] }]
      const { syncedMinCount, syncedMaxCount } = use({
        renderPoints: 4,
        datasets,
      })
      expect(syncedMinCount.value).toBe(1)
      expect(syncedMaxCount.value).toBe(1)
    })

    it('calculates from a single complicated unsorted dataset', () => {
      const datasets:SparklineDataset[] = [{ label: 'a', timestamps: [20, 20, 10, 10, 10, 10, 30, 30, 30] }]
      const { syncedMinCount, syncedMaxCount } = use({
        renderPoints: 3,
        datasets,
      })
      expect(syncedMinCount.value).toBe(2)
      expect(syncedMaxCount.value).toBe(4)
    })

    it('calculates from multiple unsorted datasets', () => {
      const datasets:SparklineDataset[] = [
        // total: three 2s, five 1s, five 3s
        { label: 'a', timestamps: [3, 1, 1, 1, 2, 2] }, // three 1s, two 2s, one 3
        { label: 'b', timestamps: [1, 2, 3, 3, 3, 1, 3] }, // two 1s, one 2, four 3s
      ]
      const { syncedMinCount, syncedMaxCount } = use({
        renderPoints: 3,
        datasets,
      })
      expect(syncedMinCount.value).toBe(1) // min of any individual dataset
      expect(syncedMaxCount.value).toBe(5) // max of combined datasets
    })

    it('syncs from multiple unsorted datasets from multiple charts', () => {
      const aDatasets:SparklineDataset[] = [
        // total: three 2s, five 1s, five 3s
        { label: 'a', timestamps: [3, 1, 1, 1, 2, 2] },
        { label: 'b', timestamps: [1, 2, 3, 3, 3, 1, 3] },
      ]

      const bDatasets:SparklineDataset[] = [
        // total: six 1s, two 2s, zero 3s
        { label: 'a', timestamps: [1, 1, 1, 1, 1, 2] },
        { label: 'b', timestamps: [1, 2] },
      ]

      const { syncedMinCount: aMin, syncedMaxCount: aMax } = use({
        chartKey: 'a',
        groupKey: groupIdA,
        renderPoints: 3,
        datasets: aDatasets,
      })
      expect(aMin.value).toBe(1) // min of any individual dataset
      expect(aMax.value).toBe(5) // max of combined datasets

      const { syncedMinCount: bMin, syncedMaxCount: bMax } = use({
        chartKey: 'b',
        groupKey: groupIdA,
        renderPoints: 3,
        datasets: bDatasets,
      })
      expect(bMin.value).toBe(0) // min of any dataset across all charts
      expect(bMax.value).toBe(6) // max of combined datasets across all charts
      expect(aMin.value).toBe(0)
      expect(aMax.value).toBe(6)
    })

    it('syncs uniquely for each groupKey', () => {
      const aDatasets:SparklineDataset[] = [
        // three 2s, five 1s, five 3s -> min 3 max 5
        { label: 'a', timestamps: [3, 1, 1, 1, 2, 2] },
        { label: 'b', timestamps: [1, 2, 3, 3, 3, 1, 3] },
      ]

      const bDatasets:SparklineDataset[] = [
        // six 1s, two 2s, zero 3s,
        { label: 'a', timestamps: [1, 1, 1, 1, 1, 2] },
        { label: 'b', timestamps: [1, 2] },
      ]

      const { syncedMinCount: aMin, syncedMaxCount: aMax } = use({
        renderPoints: 3,
        datasets: aDatasets,
      })
      const { syncedMinCount: bMin, syncedMaxCount: bMax } = use({
        renderPoints: 3,
        datasets: bDatasets,
      })

      expect(bMin.value).toBe(0)
      expect(bMax.value).toBe(6)
      expect(aMin.value).toBe(1) // not synced
      expect(aMax.value).toBe(5) // not synced
    })
  })

  describe('syncedChartDatasets', () => {
    it('combines stuff correctly', () => {
      const aDatasets:SparklineDataset[] = [
        // three 2s, five 1s, five 3s -> min 3 max 5
        { label: 'a', timestamps: [1, 1, 1, 2, 2] },
        { label: 'b', timestamps: [1, 2, 1] },
      ]

      const bDatasets:SparklineDataset[] = [
        // six 1s, two 2s, zero 3s,
        { label: 'a', timestamps: [1, 1, 1, 1, 1, 2] },
        { label: 'c', timestamps: [1, 2, 3] },
      ]

      const { syncedChartDatasets: a } = use({
        chartKey: 'a',
        groupKey: groupIdA,
        renderPoints: 2,
        datasets: aDatasets,
      })
      expect(a.value).toEqual([
        expect.objectContaining({ label: 'a', data: [{ x: 1, y: 3 }, { x: 2, y: 2 }] }),
        expect.objectContaining({ label: 'b', data: [{ x: 1, y: 2 }, { x: 2, y: 1 }] }),
      ])

      const { syncedChartDatasets: b } = use({
        chartKey: 'b',
        groupKey: groupIdA,
        renderPoints: 3,
        datasets: bDatasets,
      })
      expect(b.value).toEqual([
        expect.objectContaining({ label: 'a', data: [{ x: 1, y: 5 }, { x: 2, y: 1 }, { x: 3, y: 0 }] }),
        expect.objectContaining({ label: 'c', data: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }] }),
      ])

      // after a second chart registers itself, the first chart updates its dataset with new renderpoints
      expect(a.value).toEqual([
        expect.objectContaining({ label: 'a', data: [{ x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 0 }] }),
        expect.objectContaining({ label: 'b', data: [{ x: 1, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 0 }] }),
      ])
    })
  })
})
