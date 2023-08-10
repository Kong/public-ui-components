import ConsumerGroupForm from './ConsumerGroupForm.vue'
import { Consumer, KongManagerConsumerGroupFormConfig, KonnectConsumerGroupFormConfig } from '../types'
import {
  consumersList5,
  CreateConsumerGroupKMResponse,
  CreateConsumerGroupKonnectResponse, KMGroup, KMGroup2,
  konnectGroup,
} from '../../fixtures/mockData'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import { AxiosError } from 'axios'

const cancelRoute = { name: 'consumer-group-list' }

const konnectConfig: KonnectConsumerGroupFormConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

const KMConfig: KongManagerConsumerGroupFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<ConsumerGroupForm />', () => {
  describe('Konnect', () => {
    const interceptFetchingList = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumers*`,
        },
        {
          statusCode: status,
          body: { data: consumersList5 },
        },
      ).as('fetchList')
    }
    const interceptCreate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups`,
        },
        {
          statusCode: status,
          body: CreateConsumerGroupKonnectResponse,
        },
      ).as('createGroup')
    }
    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups/*`,
        },
        {
          statusCode: status,
          body: CreateConsumerGroupKonnectResponse,
        },
      ).as('updateGroup')
    }
    const interceptFetchGroupData = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups/*`,
        },
        {
          statusCode: status,
          body: konnectGroup,
        },
      ).as('fetchGroupData')
    }
    const interceptGetConsumers = (status = 200, response?: Consumer[]): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups/*/consumers`,
        },
        {
          statusCode: status,
          body: { consumers: response || [consumersList5[0]] },
        },
      ).as('getConsumers')
    }
    const interceptAddConsumer = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups/*/consumers`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('addConsumer')
    }
    const interceptRemoveConsumer = (status = 200): void => {
      cy.intercept(
        {
          method: 'DELETE',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/consumer_groups/*/consumers/*`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('removeConsumer')
    }

    it('Create form should be rendered correctly', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait('@fetchList')

      cy.get('.kong-ui-entities-consumer-group-form').should('be.visible')
      cy.get('.kong-ui-entities-consumer-group-form form').should('be.visible')

      cy.getTestId('consumer-group-form-name').should('be.visible')
      cy.getTestId('consumer-group-form-tags').should('be.visible')
      cy.getTestId('k-multiselect-trigger').should('be.visible')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)

      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('Submit button should be enabled if name field is filled in correctly', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait('@fetchList')

      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')

      cy.getTestId('consumer-group-form-name').type('test_name')

      cy.getTestId('form-submit').should('be.enabled')
    })

    it('loading event should be emitted when EntityBaseForm emits loading event', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('error event should be emitted when EntityBaseForm emits fetch:error event', () => {
      interceptFetchingList()

      const expectedError: AxiosError = {
        isAxiosError: false,
        toJSON(): object {
          return {}
        },
        message: 'error',
        name: 'error',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onError: cy.spy().as('onErrorSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Customer Group with consumers was created', () => {
      interceptFetchingList()
      interceptCreate()
      interceptAddConsumer()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[0].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith',
        { name: 'test_name', tags: 'test_tag', consumers: ['1'], id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb' })
    })

    it('Should emit update event after Customer Group without consumers was created', () => {
      interceptFetchingList()
      interceptCreate()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')

      cy.get('@onUpdateSpy').should('have.been.calledWith',
        { name: 'test_name', tags: 'test_tag', consumers: [], id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb' })
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchingList()
      interceptCreate(400)
      interceptAddConsumer()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Error should be visible when adding Consumer fails', () => {
      interceptFetchingList()
      interceptCreate()
      interceptAddConsumer(400)

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[0].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Should hydrate form correctly for Edit form type', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptGetConsumers()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:success', konnectGroup))

      cy.wait('@getConsumers')

      cy.getTestId('consumer-group-form-name').should('have.value', konnectGroup.item.name)
      cy.getTestId('consumer-group-form-tags').should('have.value', konnectGroup.item.tags?.join(', '))
      cy.get('[data-testid="k-multiselect-trigger"] [data-testid="k-multiselect-selections"] .k-badge-text')
        .should('contain.text', consumersList5[0].username)
    })

    it('update event should be emitted when Consumer Group was edited without changes in consumers', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptGetConsumers()
      interceptUpdate()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag1, tag5',
        consumers: ['1'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getConsumers')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })

    it('update event should be emitted when Consumer Group was edited with added consumer', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptGetConsumers()
      interceptUpdate()
      interceptAddConsumer()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag1, tag5',
        consumers: ['1', '2'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getConsumers')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.getTestId('k-multiselect-trigger').click()
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[1].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })

    it('update event should be emitted when Consumer Group was edited with removed consumer', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptGetConsumers(200, [consumersList5[0], consumersList5[1]])
      interceptUpdate()
      interceptRemoveConsumer()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag1, tag5',
        consumers: ['1'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: konnectConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getConsumers')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.getTestId('k-multiselect-trigger').click()
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[1].id}"] .select-item-label`).click({ force: true })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')
      cy.wait('@removeConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })
  })

  describe('Kong manager', () => {
    const interceptFetchingList = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumers*`,
        },
        {
          statusCode: status,
          body: { data: consumersList5 },
        },
      ).as('fetchList')
    }
    const interceptCreate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumer_groups`,
        },
        {
          statusCode: status,
          body: CreateConsumerGroupKMResponse,
        },
      ).as('createGroup')
    }
    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumer_groups/*`,
        },
        {
          statusCode: status,
          body: CreateConsumerGroupKMResponse,
        },
      ).as('updateGroup')
    }
    const interceptFetchGroupData = (status = 200, response?: Record<string, Record<string, any>>): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumer_groups/*`,
        },
        {
          statusCode: status,
          body: response || KMGroup,
        },
      ).as('fetchGroupData')
    }
    const interceptAddConsumer = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumer_groups/*/consumers`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('addConsumer')
    }
    const interceptRemoveConsumer = (status = 200): void => {
      cy.intercept(
        {
          method: 'DELETE',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumer_groups/*/consumers/*`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('removeConsumer')
    }

    it('Create form should be rendered correctly', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait('@fetchList')

      cy.get('.kong-ui-entities-consumer-group-form').should('be.visible')
      cy.get('.kong-ui-entities-consumer-group-form form').should('be.visible')

      cy.getTestId('consumer-group-form-name').should('be.visible')
      cy.getTestId('consumer-group-form-tags').should('be.visible')
      cy.getTestId('k-multiselect-trigger').should('be.visible')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)

      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('Submit button should be enabled if name field is filled in correctly', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait('@fetchList')

      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-submit').should('be.disabled')

      cy.getTestId('consumer-group-form-name').type('test_name')

      cy.getTestId('form-submit').should('be.enabled')
    })

    it('loading event should be emitted when EntityBaseForm emits loading event', () => {
      interceptFetchingList()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('error event should be emitted when EntityBaseForm emits fetch:error event', () => {
      interceptFetchingList()

      const expectedError: AxiosError = {
        isAxiosError: false,
        toJSON(): object {
          return {}
        },
        message: 'error',
        name: 'error',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onError: cy.spy().as('onErrorSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:error', expectedError))

      cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
    })

    it('Should emit update event after Customer Group with consumers was created', () => {
      interceptFetchingList()
      interceptCreate()
      interceptAddConsumer()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[0].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith',
        { name: 'test_name', tags: 'test_tag', consumers: ['1'], id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb' })
    })

    it('Should emit update event after Customer Group without consumers was created', () => {
      interceptFetchingList()
      interceptCreate()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')

      cy.get('@onUpdateSpy').should('have.been.calledWith',
        { name: 'test_name', tags: 'test_tag', consumers: [], id: 'c0b7eac5-6b6d-48ad-bd0d-3253036cfebb' })
    })

    it('Error should be visible when creation fails', () => {
      interceptFetchingList()
      interceptCreate(400)
      interceptAddConsumer()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Error should be visible when adding Consumer fails', () => {
      interceptFetchingList()
      interceptCreate()
      interceptAddConsumer(400)

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').type('test_name')
      cy.getTestId('consumer-group-form-tags').type('test_tag')

      cy.getTestId('k-multiselect-trigger').click()
      cy.get('.k-multiselect-popover').should('be.visible')
      cy.get('.k-multiselect-popover .k-multiselect-item').should('have.length', 5)
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[0].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('not.have.been.called')
      cy.getTestId('form-error').should('be.visible')
    })

    it('Should hydrate form correctly for Edit form type', () => {
      interceptFetchingList()
      interceptFetchGroupData()

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('fetch:success', KMGroup))

      cy.wait('@fetchGroupData')

      cy.getTestId('consumer-group-form-name').should('have.value', KMGroup.consumer_group.name)
      cy.getTestId('consumer-group-form-tags').should('have.value', KMGroup.consumer_group.tags?.join(', '))
      cy.get('[data-testid="k-multiselect-trigger"] [data-testid="k-multiselect-selections"] .k-badge-text')
        .should('contain.text', KMGroup.consumers[0].username)
    })

    it('update event should be emitted when Consumer Group was edited without changes in consumers', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptUpdate()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag 1',
        consumers: ['1'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })

    it('update event should be emitted when Consumer Group was edited with added consumer', () => {
      interceptFetchingList()
      interceptFetchGroupData()
      interceptUpdate()
      interceptAddConsumer()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag 1',
        consumers: ['1', '2'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.getTestId('k-multiselect-trigger').click()
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[1].id}"] .select-item-label`).click()

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')
      cy.wait('@addConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })

    it('update event should be emitted when Consumer Group was edited with removed consumer', () => {
      interceptFetchingList()
      interceptFetchGroupData(200, KMGroup2)
      interceptUpdate()
      interceptRemoveConsumer()

      const expectedOutput = {
        name: 'Another_test',
        tags: 'tag 1',
        consumers: ['1'],
        id: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
      }

      cy.mount(ConsumerGroupForm, {
        props: {
          config: KMConfig,
          consumerGroupId: '973ed6f2-3da6-4dfb-8bd5-e4235b726bd5',
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.getTestId('consumer-group-form-name').clear()
      cy.getTestId('consumer-group-form-name').type(expectedOutput.name)

      cy.getTestId('k-multiselect-trigger').click()
      cy.get(`.k-multiselect-popover [data-testid="k-multiselect-item-${consumersList5[1].id}"] .select-item-label`).click({ force: true })

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateGroup')
      cy.wait('@removeConsumer')

      cy.get('@onUpdateSpy').should('have.been.calledWith', expectedOutput)
    })
  })
})
