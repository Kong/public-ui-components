/* eslint-disable no-undef */
import sinon from 'sinon'
import { shallowMount } from '@vue/test-utils'
import FieldAutoSuggest from '@/plugins/vfg/FieldAutoSuggest'
import { $api, setupVue, sleep } from '../vtu-helpers'

const schema = {
  entity: 'services',
  inputValues: {
    fields: ['name', 'id'],
    primaryField: 'name',
  },
  model: 'service-id',
}

describe('FieldAutoSuggest', function() {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('mount(), it has no loaded suggestions', async () => {
    const wrapper = shallowMount(FieldAutoSuggest, setupVue({
      props: {
        model: {
          'service-id': '',
        },
        schema,
      },
    }))

    expect(wrapper.vm.suggestions.length).to.equal(0)
    expect(wrapper.vm.entity).to.equal('services')
  })

  it('search with exact UUID and non-UUID terms', async () => {
    sandbox.stub($api, 'findAll').resolves({
      status: 200,
      data: {
        data: [{
          id: 'f9c4da7c-781e-4b50-b6f1-3e901cacb8a7',
          name: 'test-service',
        }],
      },
      offset: null,
    })

    sandbox.stub($api, 'findRecord').resolves({
      status: 200,
      data: {
        id: 'f9c4da7c-781e-4b50-b6f1-3e901cacb8a7',
        name: 'test-service',
      },
      offset: null,
    })

    const wrapper = shallowMount(FieldAutoSuggest, setupVue({
      props: {
        model: {
          'service-id': '',
        },
        schema,
      },
    }))

    const fetchSuggestionsSpy = vi.spyOn(wrapper.vm, 'fetchSuggestions')

    const fetchUntilLimitSpy = vi.spyOn(wrapper.vm, 'fetchUntilLimit')

    const fetchExactSpy = vi.spyOn(wrapper.vm, 'fetchExact')

    await sleep(100)

    wrapper.vm.onQueryChange('f9c4da7c')
    await sleep(1000)
    expect(fetchSuggestionsSpy).to.be.toHaveBeenCalledTimes(1)
    expect(fetchUntilLimitSpy).to.be.toHaveBeenCalledTimes(1)
    expect(fetchExactSpy).to.be.toHaveBeenCalledTimes(0)

    wrapper.vm.onQueryChange('f9c4da7c-781e-4b50-b6f1-3e901cacb8a7')
    await sleep(1000)
    expect(fetchSuggestionsSpy).to.be.toHaveBeenCalledTimes(1)
    expect(fetchUntilLimitSpy).to.be.toHaveBeenCalledTimes(1)
    expect(fetchExactSpy).to.be.toHaveBeenCalledTimes(1)

    expect(wrapper.vm.items.length).to.equal(1)
    expect(wrapper.vm.items[0].id).to.equal('f9c4da7c-781e-4b50-b6f1-3e901cacb8a7')
    expect(wrapper.vm.items[0].name).to.equal('test-service')
  })
})
