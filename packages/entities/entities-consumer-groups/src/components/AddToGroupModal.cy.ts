import AddToGroupModal from './AddToGroupModal.vue'
import { KongManagerConsumerGroupListConfig, KonnectConsumerGroupListConfig } from '../types'
import { ConsumerGroup, consumerGroups5 } from '../../fixtures/mockData'
import { KPrompt } from '@kong/kongponents'

describe('<AddToGroupModal/>', () => {
  describe('Konnect', () => {
    const configGroupKonnect: KonnectConsumerGroupListConfig = {
      app: 'konnect',
      controlPlaneId: '1234-asdf-asdf-asdf',
      apiBaseUrl: '/us/kong-api/konnect-api',
      createRoute: 'create-consumer-group',
      getViewRoute: () => 'view-consumer-group',
      getEditRoute: () => 'edit-consumer-group',
      consumerId: '5921d16a-3e1d-4936-b21f-e5cae587415c',
      consumerUsername: 'Test Consumer',
    }

    const interceptFilters = (params?: {
      mockData?: ConsumerGroup[];
      alias?: string;
    }): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${configGroupKonnect.apiBaseUrl}/api/runtime_groups/${configGroupKonnect.controlPlaneId}/consumer_groups*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'interceptFilters')
    }

    const interceptSubmission = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${configGroupKonnect.apiBaseUrl}/api/runtime_groups/${configGroupKonnect.controlPlaneId}/consumers/${configGroupKonnect.consumerId}/consumer_groups`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('interceptSubmission')
    }

    it('should render correctly', () => {
      interceptFilters()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKonnect,
          visible: true,
        },
      })

      cy.wait('@interceptFilters')

      cy.getTestId('add-to-group-modal').should('exist')
      cy.get('.k-prompt-body .k-multiselect').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-cancel').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-proceed').should('exist')
    })

    it('should emit cancel event when KPrompt emits canceled event', () => {
      interceptFilters()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKonnect,
          visible: true,
          onCancel: cy.spy().as('cancelSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@interceptFilters')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('canceled'))

      cy.get('@cancelSpy').should('have.been.called')
    })

    it('should emit add:success event when KPrompt emits proceed event', () => {
      interceptFilters({
        mockData: consumerGroups5,
      })
      interceptSubmission()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKonnect,
          visible: true,
          'onAdd:success': cy.spy().as('addSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@interceptFilters')

      cy.getTestId('k-multiselect-trigger').should('be.visible')
      cy.getTestId('k-multiselect-trigger').click()

      cy.get('.k-popover-content .k-multiselect-list').should('be.visible')
      cy.get('.k-popover-content .k-multiselect-list .k-multiselect-item').should('be.visible')
      cy.get('.k-popover-content .k-multiselect-list .k-multiselect-item').should('have.length', 5)

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent('.k-multiselect')
        .vm.$emit('update:modelValue', [consumerGroups5[0].id]))
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('proceed'))

      cy.wait('@interceptSubmission')

      cy.get('@addSpy').should('have.been.called')
    })
  })

  describe('Kong Manager', () => {
    const configGroupKM: KongManagerConsumerGroupListConfig = {
      app: 'kongManager',
      workspace: 'default',
      apiBaseUrl: '/kong-manager',
      isExactMatch: false,
      filterSchema: {},
      createRoute: 'create-consumer-group',
      getViewRoute: () => 'view-consumer-group',
      getEditRoute: () => 'edit-consumer-group',
      consumerId: '5921d16a-3e1d-4936-b21f-e5cae587415c',
      consumerUsername: 'Test Consumer',
    }

    const interceptFilters = (params?: {
      mockData?: ConsumerGroup[];
      alias?: string;
    }): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${configGroupKM.apiBaseUrl}/${configGroupKM.workspace}/consumer_groups*`,
        },
        {
          statusCode: 200,
          body: {
            data: params?.mockData ?? [],
            total: params?.mockData?.length ?? 0,
          },
        },
      ).as(params?.alias ?? 'interceptFilters')
    }

    const interceptSubmission = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${configGroupKM.apiBaseUrl}/${configGroupKM.workspace}/consumers/${configGroupKM.consumerId}/consumer_groups`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('interceptSubmission')
    }

    it('should render correctly', () => {
      interceptFilters()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKM,
          visible: true,
        },
      })

      cy.wait('@interceptFilters')

      cy.getTestId('add-to-group-modal').should('exist')
      cy.get('.k-prompt-body .k-multiselect').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-cancel').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-proceed').should('exist')
    })

    it('should emit cancel event when KPrompt emits canceled event', () => {
      interceptFilters()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKM,
          visible: true,
          onCancel: cy.spy().as('cancelSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@interceptFilters')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('canceled'))

      cy.get('@cancelSpy').should('have.been.called')
    })

    it('should emit add:success event when KPrompt emits proceed event', () => {
      interceptFilters({
        mockData: consumerGroups5,
      })
      interceptSubmission()

      cy.mount(AddToGroupModal, {
        props: {
          config: configGroupKM,
          visible: true,
          'onAdd:success': cy.spy().as('addSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@interceptFilters')

      cy.getTestId('k-multiselect-trigger').should('be.visible')
      cy.getTestId('k-multiselect-trigger').click()

      cy.get('.k-popover-content .k-multiselect-list').should('be.visible')
      cy.get('.k-popover-content .k-multiselect-list .k-multiselect-item').should('be.visible')
      cy.get('.k-popover-content .k-multiselect-list .k-multiselect-item').should('have.length', 5)

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.getComponent('.k-multiselect')
        .vm.$emit('update:modelValue', [consumerGroups5[0].id]))
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('proceed'))

      cy.wait('@interceptSubmission')

      cy.get('@addSpy').should('have.been.called')
    })
  })
})
