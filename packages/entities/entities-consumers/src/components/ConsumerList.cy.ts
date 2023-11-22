// Cypress component test spec file
import type { Consumer } from '../../fixtures/mockData'
import {
  consumers100,
  consumers5,
  paginate,
} from '../../fixtures/mockData'
import type {
  KongManagerConsumerListConfig,
  KonnectConsumerListConfig,
} from '../types'
import ConsumerList from './ConsumerList.vue'
import AddConsumerModal from './AddConsumerModal.vue'
import { v4 as uuidv4 } from 'uuid'

describe('<ConsumerList />', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', err => !err.message.includes('ResizeObserver loop limit exceeded'))
  })

  describe('Kong Manager', () => {
    const baseConfigKM: KongManagerConsumerListConfig = {
      app: 'kongManager',
      workspace: 'default',
      apiBaseUrl: '/kong-manager',
      isExactMatch: false,
      filterSchema: {},
      createRoute: 'create-consumer',
      getViewRoute: () => 'view-consumer',
      getEditRoute: () => 'edit-consumer',
    }
    const configGroupKM: KongManagerConsumerListConfig = {
      app: 'kongManager',
      workspace: 'default',
      apiBaseUrl: '/kong-manager',
      isExactMatch: false,
      filterSchema: {},
      createRoute: 'create-consumer',
      getViewRoute: () => 'view-consumer',
      getEditRoute: () => 'edit-consumer',
      consumerGroupId: '5921d16a-3e1d-4936-b21f-e5cae587415c',
      consumerGroupName: 'Test Group',
    }

    const interceptKM = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'getConsumers')
    }

    const interceptGroupKM = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${configGroupKM.workspace}/consumer_groups/${configGroupKM.consumerGroupId}/consumers*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'getGroupConsumers')
    }

    const interceptRemoveGroupKM = (params?: {
      status?: number;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'DELETE',
          url: `${baseConfigKM.apiBaseUrl}/${configGroupKM.workspace}/consumer_groups/${configGroupKM.consumerGroupId}/consumers/*`,
        },
        {
          statusCode: params?.status || 200,
          body: {},
        },
      ).as(params?.alias ?? 'removeGroupConsumer')
    }

    const interceptKMMultiPage = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getConsumersMultiPage')
    }

    const triggerQuery = '.kong-ui-entities-consumers-list tbody tr [data-testid="dropdown-trigger"]'
    const removeQuery = '.kong-ui-entities-consumers-list tbody tr [data-testid="action-entity-delete"]'
    const modalQuery = 'remove-consumer-modal'

    it('should show empty state and create consumer cta', () => {
      interceptKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-consumer"]').should('be.visible')
    })

    it('should hide empty state and create consumer cta if user can not create', () => {
      interceptKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-consumer"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/consumers*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getConsumers')

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show consumer items', () => {
      interceptKM({
        mockData: consumers5,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get(
        '.kong-ui-entities-consumers-list tr[data-testid="consumer.1"]',
      ).should('exist')
      cy.get(
        '.kong-ui-entities-consumers-list tr[data-testid="consumer.2"]',
      ).should('exist')
    })

    it('should allow switching between pages', () => {
      interceptKMMultiPage({
        mockData: consumers100,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-consumers-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getConsumersMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getConsumersMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="consumer.91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`).should(
        'have.class',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      interceptKMMultiPage({
        mockData: consumers100,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-consumers-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKM,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })

    it('should render correct Add Consumer button when consumerGroupId is provided', () => {
      interceptGroupKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').should('exist')
      cy.getTestId('new-consumer').should('not.exist')
    })

    it('should render AddConsumerModal onclick Add Consumer button when consumerGroupId is provided', () => {
      interceptGroupKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')
    })

    it('should hide AddConsumerModal when modal emits cancel event', () => {
      interceptGroupKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal).vm.$emit('cancel'))

      cy.getTestId('add-consumer-modal').should('not.exist')
    })

    it('should hide AddConsumerModal and emit add:success event when modal emits add:success event', () => {
      const expectedData = ['test 1', 'test 2']
      interceptGroupKM()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKM,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
          'onAdd:success': cy.spy().as('addSuccess'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal).vm.$emit('add:success', expectedData))

      cy.get('@addSuccess').should('have.been.calledOnceWith', expectedData)
      cy.getTestId('add-consumer-modal').should('not.exist')
    })

    it('should not hide AddConsumerModal and emit add:success event when modal emits add:partial-success event',
      () => {
        const expectedData = ['test 1', 'test 2']
        interceptGroupKM()

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKM,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
            'onAdd:success': cy.spy().as('addSuccess'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId('toolbar-add-consumer').click()
        cy.getTestId('add-consumer-modal').should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal)
          .vm.$emit('add:partial-success', expectedData))

        cy.get('@addSuccess').should('have.been.calledOnceWith', expectedData)
        cy.getTestId('add-consumer-modal').should('exist')
      })

    it('should render correct Remove item in action dropdown',
      () => {
        interceptGroupKM({
          mockData: consumers5,
        })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKM,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')
        const popoverQuery = '.kong-ui-entities-consumers-list tbody tr .k-popover'

        cy.get('.kong-ui-entities-consumers-list').should('be.visible')
        cy.get(triggerQuery).should('be.visible')
        cy.get(triggerQuery).click()
        cy.get(popoverQuery).should('be.visible')
        cy.get(removeQuery).should('be.visible')
        cy.get(removeQuery).should('have.text', 'Remove')
      })

    it('should hide Remove Consumer modal when this modal emits canceled event',
      () => {
        interceptGroupKM({
          mockData: consumers5,
        })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKM,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('canceled'))

        cy.getTestId(modalQuery).should('not.exist')
      })

    it('should remove Consumer and emit remove:success event when modal emits proceed event',
      () => {
        interceptGroupKM({
          mockData: consumers5,
        })
        interceptRemoveGroupKM()

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKM,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
            'onRemove:success': cy.spy().as('removeSuccess'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('proceed'))

        cy.wait('@removeGroupConsumer')

        cy.get('@removeSuccess').should('have.been.called')

        cy.getTestId(modalQuery).should('not.exist')
      })

    it('should emit error event when removing fails',
      () => {
        interceptGroupKM({
          mockData: consumers5,
        })
        interceptRemoveGroupKM({ status: 500 })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKM,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
            onError: cy.spy().as('errorSpy'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('proceed'))

        cy.wait('@removeGroupConsumer')

        cy.get('@errorSpy').should('have.been.called')

        cy.getTestId(modalQuery).should('exist')
      })
  })

  describe('Konnect', () => {
    const baseConfigKonnect: KonnectConsumerListConfig = {
      app: 'konnect',
      controlPlaneId: '1234-abcd-ilove-cats',
      apiBaseUrl: '/us/konnect-v2',
      createRoute: 'create-consumer',
      getViewRoute: () => 'view-consumer',
      getEditRoute: () => 'edit-consumer',
    }
    const configGroupKonnect: KonnectConsumerListConfig = {
      app: 'konnect',
      controlPlaneId: '1234-abcd-ilove-cats',
      apiBaseUrl: '/us/konnect-v2',
      createRoute: 'create-consumer',
      getViewRoute: () => 'view-consumer',
      getEditRoute: () => 'edit-consumer',
      consumerGroupId: '5921d16a-3e1d-4936-b21f-e5cae587415c',
      consumerGroupName: 'Test Group',
    }

    const interceptKonnect = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'getConsumers')
    }
    const interceptGroupKonnect = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${configGroupKonnect.apiBaseUrl}/v2/control-planes/${configGroupKonnect.controlPlaneId}/core-entities/consumer_groups/${configGroupKonnect.consumerGroupId}/consumers*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'getGroupConsumers')
    }
    const interceptRemoveGroupKonnect = (params?: {
      status?: number;
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'DELETE',
          url: `${configGroupKonnect.apiBaseUrl}/v2/control-planes/${configGroupKonnect.controlPlaneId}/core-entities/consumer_groups/${configGroupKonnect.consumerGroupId}/consumers/*`,
        },
        {
          statusCode: params?.status || 200,
          body: {},
        },
      ).as(params?.alias ?? 'removeGroupConsumer')
    }

    const interceptKonnectMultiPage = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers*`,
        },
        (req) => {
          const size = req.query.size ? Number(req.query.size) : 30
          const offset = req.query.offset ? Number(req.query.offset) : 0

          req.reply({
            statusCode: 200,
            body: paginate(params?.mockData ?? [], size, offset),
          })
        },
      ).as(params?.alias ?? 'getConsumersMultiPage')
    }

    const triggerQuery = '.kong-ui-entities-consumers-list tbody tr [data-testid="dropdown-trigger"]'
    const removeQuery = '.kong-ui-entities-consumers-list tbody tr [data-testid="action-entity-delete"]'
    const modalQuery = 'remove-consumer-modal'

    it('should show empty state and create consumer cta', () => {
      interceptKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-consumer"]').should('be.visible')
    })

    it('should hide empty state and create consumer cta if user can not create', () => {
      interceptKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => false,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-empty-state').should('be.visible')
      cy.get('[data-testid="new-consumer"]').should('not.exist')
    })

    it('should handle error state', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/consumers*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getConsumers')

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get('.kong-ui-entities-consumers-list').should('be.visible')
      cy.get('.k-table-error-state').should('be.visible')
    })

    it('should show consumer items', () => {
      interceptKonnect({
        mockData: consumers5,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumers')
      cy.get(
        '.kong-ui-entities-consumers-list tr[data-testid="consumer.1"]',
      ).should('exist')
      cy.get(
        '.kong-ui-entities-consumers-list tr[data-testid="consumer.2"]',
      ).should('exist')
    })

    it('should allow switching between pages', () => {
      interceptKonnectMultiPage({
        mockData: consumers100,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      const l = '.kong-ui-entities-consumers-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getConsumersMultiPage')

      // Page #1
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.30"]`).should('exist')

      cy.get(`${l} ${p}`).should('exist')
      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getConsumersMultiPage')

      // Page #2
      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.31"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.32"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.59"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.60"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} ${p} [data-testid="next-btn"]`)
        .should('not.have.class', 'disabled')
        .click() // next page

      // Page #4
      cy.get(`${l} tbody tr`).should('have.length', 10)
      cy.get(`${l} tbody tr[data-testid="consumer.91"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.92"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.99"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.100"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="prev-btn"]`).should(
        'not.have.class',
        'disabled',
      )
      cy.get(`${l} ${p} [data-testid="next-btn"]`).should(
        'have.class',
        'disabled',
      )
    })

    it('should allow picking different page sizes and persist the preference', () => {
      interceptKonnectMultiPage({
        mockData: consumers100,
      })

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })
        .then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      const l = '.kong-ui-entities-consumers-list'
      const p = '[data-testid="k-table-pagination"]'

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 30)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.29"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.30"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '30 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="15"]`,
      ).click()

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.15"]`).should('exist')

      // Unmount and mount
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.unmount())
      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: baseConfigKonnect,
          canCreate: () => {},
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 15)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.14"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.15"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '15 items per page',
      )
      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).click()
      cy.get(
        `${l} ${p} [data-testid="page-size-dropdown"] [value="50"]`,
      ).click()

      cy.wait('@getConsumersMultiPage')

      cy.get(`${l} tbody tr`).should('have.length', 50)
      cy.get(`${l} tbody tr[data-testid="consumer.1"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.2"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.49"]`).should('exist')
      cy.get(`${l} tbody tr[data-testid="consumer.50"]`).should('exist')

      cy.get(`${l} ${p} [data-testid="page-size-dropdown"]`).should(
        'contain.text',
        '50 items per page',
      )
    })

    it('should render correct Add Consumer button when consumerGroupId is provided', () => {
      interceptGroupKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').should('exist')
      cy.getTestId('new-consumer').should('not.exist')
    })

    it('should render AddConsumerModal onclick Add Consumer button when consumerGroupId is provided', () => {
      interceptGroupKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      })

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')
    })

    it('should hide AddConsumerModal when modal emits cancel event', () => {
      interceptGroupKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal).vm.$emit('cancel'))

      cy.getTestId('add-consumer-modal').should('not.exist')
    })

    it('should hide AddConsumerModal and emit add:success event when modal emits add:success event', () => {
      const expectedData = ['test 1', 'test 2']
      interceptGroupKonnect()

      cy.mount(ConsumerList, {
        props: {
          cacheIdentifier: `consumer-list-${uuidv4()}`,
          config: configGroupKonnect,
          canCreate: () => true,
          canEdit: () => {},
          canDelete: () => {},
          canRetrieve: () => {},
          'onAdd:success': cy.spy().as('addSuccess'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getGroupConsumers')

      cy.getTestId('toolbar-add-consumer').click()
      cy.getTestId('add-consumer-modal').should('exist')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal).vm.$emit('add:success', expectedData))

      cy.get('@addSuccess').should('have.been.calledOnceWith', expectedData)
      cy.getTestId('add-consumer-modal').should('not.exist')
    })

    it('should not hide AddConsumerModal and emit add:success event when modal emits add:partial-success event',
      () => {
        const expectedData = ['test 1', 'test 2']
        interceptGroupKonnect()

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKonnect,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => {},
            canRetrieve: () => {},
            'onAdd:success': cy.spy().as('addSuccess'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId('toolbar-add-consumer').click()
        cy.getTestId('add-consumer-modal').should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(AddConsumerModal)
          .vm.$emit('add:partial-success', expectedData))

        cy.get('@addSuccess').should('have.been.calledOnceWith', expectedData)
        cy.getTestId('add-consumer-modal').should('exist')
      })

    it('should render correct Remove item in action dropdown',
      () => {
        interceptGroupKonnect({
          mockData: consumers5,
        })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKonnect,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')
        const popoverQuery = '.kong-ui-entities-consumers-list tbody tr .k-popover'

        cy.get('.kong-ui-entities-consumers-list').should('be.visible')
        cy.get(triggerQuery).should('be.visible')
        cy.get(triggerQuery).click()
        cy.get(popoverQuery).should('be.visible')
        cy.get(removeQuery).should('be.visible')
        cy.get(removeQuery).should('have.text', 'Remove')
      })

    it('should hide Remove Consumer modal when this modal emits canceled event',
      () => {
        interceptGroupKonnect({
          mockData: consumers5,
        })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKonnect,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('canceled'))

        cy.getTestId(modalQuery).should('not.exist')
      })

    it('should remove Consumer and emit remove:success event when modal emits proceed event',
      () => {
        interceptGroupKonnect({
          mockData: consumers5,
        })
        interceptRemoveGroupKonnect()

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKonnect,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
            'onRemove:success': cy.spy().as('removeSuccess'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('proceed'))

        cy.wait('@removeGroupConsumer')

        cy.get('@removeSuccess').should('have.been.called')

        cy.getTestId(modalQuery).should('not.exist')
      })

    it('should emit error event when removing fails',
      () => {
        interceptGroupKonnect({
          mockData: consumers5,
        })
        interceptRemoveGroupKonnect({ status: 500 })

        cy.mount(ConsumerList, {
          props: {
            cacheIdentifier: `consumer-list-${uuidv4()}`,
            config: configGroupKonnect,
            canCreate: () => true,
            canEdit: () => {},
            canDelete: () => true,
            canRetrieve: () => {},
            onError: cy.spy().as('errorSpy'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getGroupConsumers')

        cy.getTestId(modalQuery).should('not.exist')

        cy.get(triggerQuery).click()
        cy.get(removeQuery).should('be.visible').click()

        cy.getTestId(modalQuery).should('exist')

        cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent(`[data-testid="${modalQuery}"]`)
          .vm.$emit('proceed'))

        cy.wait('@removeGroupConsumer')

        cy.get('@errorSpy').should('have.been.called')

        cy.getTestId(modalQuery).should('exist')
      })
  })
})
