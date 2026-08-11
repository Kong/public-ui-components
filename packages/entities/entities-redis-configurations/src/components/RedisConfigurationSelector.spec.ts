import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import RedisConfigurationSelector from './RedisConfigurationSelector.vue'

const EXISTING_ID = 'redis-existing'
const NEW_ID = 'redis-new'
const NEW_REDIS = '[data-testid="new-redis-config-area"]'
const SLIDEOUT = '[data-testid="redis-create-slideout"]'

const loadItems = vi.fn()

vi.mock('../composables/useRedisConfigurationSelector', () => ({
  useRedisConfigurationSelector: () => ({
    items: ref([]),
    loading: ref(false),
    onQueryChange: vi.fn(),
    error: ref(null),
    loadItems,
  }),
}))

const stubs = {
  KSelect: {
    template: `
      <div>
        <slot name="dropdown-footer-text" />
      </div>
    `,
  },
  KBadge: true,
  AddIcon: true,
  RedisConfigurationFormSlideout: {
    name: 'RedisConfigurationFormSlideout',
    props: ['visible'],
    emits: ['close', 'created'],
    template: '<div v-if="visible" data-testid="redis-create-slideout" />',
  },
  RedisConfigurationFormModal: true,
}

const mountSelector = (modelValue?: string) =>
  mount(RedisConfigurationSelector, {
    props: {
      modelValue,
      showCreateButton: true,
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
      },
    },
  })

describe('RedisConfigurationSelector', () => {
  beforeEach(() => {
    loadItems.mockClear()
  })

  it('opens the create slideout when New Redis is clicked', async () => {
    const wrapper = mountSelector()

    await wrapper.get(NEW_REDIS).trigger('click')

    expect(wrapper.find(SLIDEOUT).exists()).toBe(true)
  })

  it('restores the previous selection when create is cancelled', async () => {
    const wrapper = mountSelector(EXISTING_ID)

    await wrapper.get(NEW_REDIS).trigger('click')
    await wrapper.getComponent({ name: 'RedisConfigurationFormSlideout' }).vm.$emit('close')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([EXISTING_ID])
  })

  it('selects the new redis id after create succeeds', async () => {
    const wrapper = mountSelector(EXISTING_ID)

    await wrapper.get(NEW_REDIS).trigger('click')
    await wrapper.getComponent({ name: 'RedisConfigurationFormSlideout' }).vm.$emit('created', {
      id: NEW_ID,
      name: 'new-redis',
    })

    expect(loadItems).toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([NEW_ID])
  })
})
