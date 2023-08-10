import AddConsumerModal from './AddConsumerModal.vue'
import { KongManagerConsumerListConfig, KonnectConsumerListConfig } from '../types'
import { Consumer, consumers5 } from '../../fixtures/mockData'
import { KPrompt } from '@kong/kongponents'

describe('<AddConsumerModal/>', () => {
  describe('Konnect', () => {
    const configGroupKonnect: KonnectConsumerListConfig = {
      app: 'konnect',
      controlPlaneId: '1234-asdf-asdf-asdf',
      apiBaseUrl: '/us/kong-api/konnect-api',
      createRoute: 'create-consumer',
      getViewRoute: () => 'view-consumer',
      getEditRoute: () => 'edit-consumer',
      consumerGroupId: '5921d16a-3e1d-4936-b21f-e5cae587415c',
      consumerGroupName: 'Test Group',
    }

    const interceptFilters = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${configGroupKonnect.apiBaseUrl}/api/runtime_groups/${configGroupKonnect.controlPlaneId}/consumers*`,
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
          url: `${configGroupKonnect.apiBaseUrl}/api/runtime_groups/${configGroupKonnect.controlPlaneId}/consumer_groups/${configGroupKonnect.consumerGroupId}/consumers`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('interceptSubmission')
    }

    it('should renders correctly', () => {
      interceptFilters()

      cy.mount(AddConsumerModal, {
        props: {
          config: configGroupKonnect,
          visible: true,
        },
      })

      cy.wait('@interceptFilters')

      cy.getTestId('add-consumer-modal').should('exist')
      cy.get('.k-prompt-body .k-multiselect').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-cancel').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-proceed').should('exist')
    })

    it('should emit cancel event when KPrompt emits canceled event', () => {
      interceptFilters()

      cy.mount(AddConsumerModal, {
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
        mockData: consumers5,
      })
      interceptSubmission()

      cy.mount(AddConsumerModal, {
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
        .vm.$emit('update:modelValue', [consumers5[0].id]))
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('proceed'))

      cy.wait('@interceptSubmission')

      cy.get('@addSpy').should('have.been.called')
    })
  })

  describe('Kong Manager', () => {
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

    const interceptFilters = (params?: {
      mockData?: Consumer[];
      alias?: string;
    }): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${configGroupKM.apiBaseUrl}/${configGroupKM.workspace}/consumers*`,
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
          url: `${configGroupKM.apiBaseUrl}/${configGroupKM.workspace}/consumer_groups/${configGroupKM.consumerGroupId}/consumers`,
        },
        {
          statusCode: status,
          body: {},
        },
      ).as('interceptSubmission')
    }

    it('should renders correctly', () => {
      interceptFilters()

      cy.mount(AddConsumerModal, {
        props: {
          config: configGroupKM,
          visible: true,
        },
      })

      cy.wait('@interceptFilters')

      cy.getTestId('add-consumer-modal').should('exist')
      cy.get('.k-prompt-body .k-multiselect').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-cancel').should('exist')
      cy.get('.k-prompt-action-buttons .k-prompt-proceed').should('exist')
    })

    it('should emit cancel event when KPrompt emits canceled event', () => {
      interceptFilters()

      cy.mount(AddConsumerModal, {
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
        mockData: consumers5,
      })
      interceptSubmission()

      cy.mount(AddConsumerModal, {
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
        .vm.$emit('update:modelValue', [consumers5[0].id]))
      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(KPrompt)
        .vm.$emit('proceed'))

      cy.wait('@interceptSubmission')

      cy.get('@addSpy').should('have.been.called')
    })
  })
})
