import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { FORMS_API_KEY } from '../const'
import ScopedEntitySelect from './ScopedEntitySelect.vue'

const SERVICE_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_ID = '22222222-2222-2222-2222-222222222222'

const EntityAutoSuggestStub = defineComponent({
  name: 'EntityAutoSuggest',
  props: {
    suggestions: { type: Array, default: () => [] },
  },
  emits: ['change', 'query-change'],
  template: '<div data-testid="entity-auto-suggest" />',
})

// The prefetch returns every service, so the select searches them inline
const mountSelect = async () => {
  const api = {
    peek: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: SERVICE_ID, name: `service-${OTHER_ID}` },
          { id: OTHER_ID, name: 'other-service' },
        ],
      },
    }),
  }

  const wrapper = mount(ScopedEntitySelect, {
    props: {
      id: '',
      domId: 'service',
      entity: 'services',
      fields: ['name', 'id'],
      allowUuidSearch: true,
    },
    global: {
      provide: { [FORMS_API_KEY]: api },
      stubs: { EntityAutoSuggest: EntityAutoSuggestStub },
    },
  })
  await flushPromises()

  return wrapper.findComponent(EntityAutoSuggestStub)
}

const suggestionIds = (stub: Awaited<ReturnType<typeof mountSelect>>) =>
  (stub.props('suggestions') as Array<{ id: string }>).map(item => item.id)

describe('ScopedEntitySelect', () => {
  it('searches a name that contains a UUID by name', async () => {
    const stub = await mountSelect()

    stub.vm.$emit('query-change', `service-${OTHER_ID}`)
    await flushPromises()

    expect(suggestionIds(stub)).toEqual([SERVICE_ID])
  })

  it('searches an exact UUID by id', async () => {
    const stub = await mountSelect()

    stub.vm.$emit('query-change', OTHER_ID)
    await flushPromises()

    expect(suggestionIds(stub)).toEqual([OTHER_ID])
  })
})
