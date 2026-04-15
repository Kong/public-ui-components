import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import { FORMS_API_KEY } from '@kong-ui-public/forms'
import Form from './Form.vue'
import ScopeEntityField from './ScopeEntityField.vue'

const CONSUMER_ID = 'test-consumer-uuid'

const schema = {
  type: 'record' as const,
  fields: [
    { consumer: { type: 'foreign' as const, reference: 'consumers' } },
  ],
}

const FieldScopedEntitySelectStub = defineComponent({
  name: 'FieldScopedEntitySelect',
  props: {
    selectedItem: { default: undefined },
    selectedItemLoading: Boolean,
    initialItemSelected: Boolean,
    id: String,
    disabled: Boolean,
    domId: String,
    entity: String,
    fieldDisabled: Boolean,
    fields: Array,
    labelField: String,
    placeholder: String,
    allowUuidSearch: Boolean,
  },
  emits: ['change'],
  template: '<div data-testid="entity-select" />',
})

function createWrapper(developer?: boolean, apiStatus: 200 | 404 = 404) {
  const mockApi = {
    getOne: vi.fn().mockResolvedValue({
      status: apiStatus,
      data: apiStatus === 200
        ? { id: CONSUMER_ID, username: 'test-user' }
        : {},
    }),
  }

  const Wrapper = defineComponent({
    setup() {
      return () => h(
        Form,
        { schema, data: { consumer: { id: CONSUMER_ID } } },
        { default: () => h(ScopeEntityField, { name: 'consumer', entity: 'consumers', developer }) },
      )
    },
  })

  const wrapper = mount(Wrapper, {
    global: {
      provide: { [FORMS_API_KEY]: mockApi },
      stubs: { FieldScopedEntitySelect: FieldScopedEntitySelectStub, KLabel: true },
    },
  })

  return { wrapper, mockApi }
}

describe('ScopeEntityField', () => {
  afterEach(() => vi.restoreAllMocks())

  it('fetches and displays the entity when found (200)', async () => {
    const { wrapper } = createWrapper(false, 200)
    await flushPromises()

    const stub = wrapper.findComponent(FieldScopedEntitySelectStub)
    expect(stub.props('selectedItem')).toMatchObject({ value: CONSUMER_ID })
  })

  it('clears selectedItem when entity not found (404) and developer=false', async () => {
    const { wrapper } = createWrapper(false, 404)
    await flushPromises()

    const stub = wrapper.findComponent(FieldScopedEntitySelectStub)
    expect(stub.props('selectedItem')).toBeUndefined()
  })

  it('uses id as fallback selectedItem when entity not found (404) and developer=true', async () => {
    const { wrapper } = createWrapper(true, 404)
    await flushPromises()

    const stub = wrapper.findComponent(FieldScopedEntitySelectStub)
    expect(stub.props('selectedItem')).toEqual({ label: CONSUMER_ID, value: CONSUMER_ID })
  })

})
