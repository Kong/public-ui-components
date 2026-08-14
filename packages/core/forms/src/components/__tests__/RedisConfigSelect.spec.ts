import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { FORMS_CONFIG, REDIS_CREATE_SLIDEOUT, REDIS_PARTIAL_FETCHER_KEY } from '../../const'
import RedisConfigSelect from '../RedisConfigSelect.vue'

const EXISTING_ID = 'redis-existing'
const NEW_ID = 'redis-new'
const NEW_REDIS = '[data-testid="new-redis-config-area"]'
const SLIDEOUT = '[data-testid="redis-create-slideout"]'

const loadItems = vi.fn().mockResolvedValue(undefined)

vi.mock('@kong-ui-public/entities-shared', () => ({
  useDebouncedFilter: () => ({
    debouncedQueryChange: vi.fn(),
    loading: ref(false),
    error: ref(null),
    loadItems,
    results: ref([]),
  }),
  useAxios: () => ({
    axiosInstance: {
      get: vi.fn().mockResolvedValue({ data: {} }),
    },
  }),
  useErrors: () => ({
    getMessageFromError: (e: unknown) => String(e),
  }),
}))

const SlideoutStub = {
  name: 'RedisCreateSlideoutStub',
  props: ['visible'],
  emits: ['close', 'created'],
  template: '<div v-if="visible" data-testid="redis-create-slideout" />',
}

const stubs = {
  KSelect: {
    template: `
      <div>
        <slot name="dropdown-footer-text" />
      </div>
    `,
  },
  KLabel: true,
  KBadge: true,
  AddIcon: true,
  RedisConfigCard: true,
}

const mountSelect = (defaultRedisConfigItem = '') => {
  const updateRedisModel = vi.fn()

  const wrapper = mount(RedisConfigSelect, {
    props: {
      defaultRedisConfigItem,
      updateRedisModel,
      pluginRedisFields: [],
      redisType: 'redis-ee',
    },
    global: {
      stubs,
      provide: {
        [FORMS_CONFIG]: {
          app: 'konnect',
          apiBaseUrl: '/us/kong-api',
          controlPlaneId: 'cp-1',
          isKonnectManagedRedisEnabled: true,
          isCloudGateway: false,
        },
        [REDIS_PARTIAL_FETCHER_KEY]: ref(0),
        [REDIS_CREATE_SLIDEOUT]: {
          component: SlideoutStub,
          toast: vi.fn(),
        },
      },
    },
  })

  return { wrapper, updateRedisModel }
}

describe('RedisConfigSelect', () => {
  beforeEach(() => {
    loadItems.mockClear()
  })

  it('opens the create slideout when New Redis is clicked', async () => {
    const { wrapper } = mountSelect()

    await wrapper.get(NEW_REDIS).trigger('click')

    expect(wrapper.find(SLIDEOUT).exists()).toBe(true)
  })

  it('restores the previous selection when create is cancelled', async () => {
    const { wrapper, updateRedisModel } = mountSelect(EXISTING_ID)

    await wrapper.get(NEW_REDIS).trigger('click')
    await wrapper.getComponent({ name: 'RedisCreateSlideoutStub' }).vm.$emit('close')

    expect(updateRedisModel).toHaveBeenLastCalledWith(EXISTING_ID)
  })

  it('selects the new redis id after create succeeds', async () => {
    const { wrapper, updateRedisModel } = mountSelect(EXISTING_ID)

    await wrapper.get(NEW_REDIS).trigger('click')
    await wrapper.getComponent({ name: 'RedisCreateSlideoutStub' }).vm.$emit('created', {
      id: NEW_ID,
      name: 'new-redis',
    })

    expect(loadItems).toHaveBeenCalled()
    expect(updateRedisModel).toHaveBeenLastCalledWith(NEW_ID)
  })
})
