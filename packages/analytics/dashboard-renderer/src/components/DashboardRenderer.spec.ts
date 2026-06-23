import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import Ajv from 'ajv'
import { dashboardConfigSchema, type DashboardConfig } from '@kong-ui-public/analytics-utilities'
import DashboardRenderer from './DashboardRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

const createGridLayoutStub = vi.hoisted(() => (name: string) => {
  return {
    name,
    props: {
      tiles: {
        type: Array,
        required: true,
      },
    },
    template: '<div><slot v-for="tile in tiles" name="tile" :tile="tile" /></div>',
  }
})

vi.mock('./layout/GridLayout.vue', () => ({
  default: createGridLayoutStub('GridLayout'),
}))

vi.mock('./layout/DraggableGridLayout.vue', () => ({
  default: createGridLayoutStub('DraggableGridLayout'),
}))

vi.mock('./DashboardTile.vue', () => ({
  default: defineComponent({
    name: 'DashboardTile',
    props: {
      definition: {
        type: Object,
        required: true,
      },
      tileId: {
        type: [String, Number],
        required: true,
      },
      tileType: {
        type: String,
        required: true,
      },
    },
    emits: ['duplicate-tile'],
    setup(props, { emit }) {
      return () => h('button', {
        'data-testid': `duplicate-dashboard-tile-${props.tileId}`,
        'data-tile-type': props.tileType,
        onClick: () => emit('duplicate-tile', props.definition),
      }, 'Duplicate')
    },
  }),
}))

const ajv = new Ajv({ allowUnionTypes: true })
const validate = ajv.compile(dashboardConfigSchema)

describe('Dashboard schemas', () => {
  it('successfully validates bar chart schemas', () => {
    const definition: any = {
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'horizontal_bar',
            },
            query: {
              datasource: 'basic',
            },
          },
          layout: {
            position: {
              col: 1,
              row: 1,
            },
            size: {
              cols: 1,
              rows: 1,
            },
          },
        },
      ],
    }

    expect(validate(definition)).toBe(true)
  })

  it('successfully validates gauge chart schemas', () => {
    const definition: any = {
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'gauge',
              metric_display: 'full',
              reverse_dataset: true,
              numerator: 0,
            },
            query: {
              datasource: 'basic',
            },
          },
          layout: {
            position: {
              col: 1,
              row: 1,
            },
            size: {
              cols: 1,
              rows: 1,
            },
          },
        },
      ],
    }

    expect(validate(definition)).toBe(true)
  })

  it('rejects bad gauge chart schemas', () => {
    const definition1: any = {
      tiles: [
        {
          type: 'chart',
          chart: {
            type: 'gauge',
            blah: 'arrgh',
          },
          query: {},
        },
      ],
    }

    expect(validate(definition1)).toBe(false)

    const definition2: any = {
      tiles: [
        {
          chart: {
            type: 'gauge',
            metricDisplay: 'arrgh',
          },
          query: {},
        },
      ],
    }

    expect(validate(definition2)).toBe(false)

    // Note: Error messages aren't great right now because FromSchema doesn't understand
    // the `discriminator` field, and AJV has limited support for it.
  })
})

describe('<DashboardRenderer /> table tiles', () => {
  it('preserves table tile type when duplicating', async () => {
    setupPiniaTestStore()

    const model: DashboardConfig = {
      tiles: [
        {
          id: 'table-1',
          type: 'table',
          definition: {
            config: {
              title: 'Routes',
            },
            query: {
              datasource: 'platform',
              entity: 'route',
              columns: ['route'],
            },
          },
          layout: {
            position: {
              col: 0,
              row: 0,
            },
            size: {
              cols: 2,
              rows: 2,
            },
          },
        },
      ],
    }

    const wrapper = mount(DashboardRenderer, {
      props: {
        context: {},
        modelValue: model,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            configFn: vi.fn().mockResolvedValue({ analytics: { percentiles: true } }),
            datasourceConfigFn: vi.fn().mockResolvedValue([]),
            evaluateFeatureFlagFn: vi.fn(),
            queryFn: vi.fn(),
          },
        },
        stubs: {
          KAlert: true,
        },
      },
    })

    await wrapper.getTestId('duplicate-dashboard-tile-table-1').trigger('click')

    expect(model.tiles).toHaveLength(2)
    expect(model.tiles[1].type).toBe('table')
    expect(model.tiles[1].definition.config).toEqual({
      title: 'Copy of Routes',
    })
    expect(model.tiles[1].definition.query).toMatchObject({
      datasource: 'platform',
      entity: 'route',
      columns: ['route'],
    })
  })
})
