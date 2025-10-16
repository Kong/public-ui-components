import ConsumerForm from './ConsumerForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import type {
  ConsumerPayload,
  KongManagerConsumerFormConfig,
  KonnectConsumerFormConfig,
} from '../types'
import type { AxiosError } from 'axios'

const cancelRoute = { name: 'consumer-list' }

const konnectConfig: KonnectConsumerFormConfig = {
  app: 'konnect',
  controlPlaneId: 'f0acb165-ff05-4788-aa06-6909b8d1694e',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

const KMConfig: KongManagerConsumerFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<ConsumerForm/>', () => {
  describe('Common', () => {
    it('Create form should be rendered correctly', () => {
      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.get('.kong-ui-entities-consumer-form').should('be.visible')
      cy.get('.kong-ui-entities-consumer-form form').should('be.visible')

      cy.getTestId('consumer-form-username').should('be.visible')
      cy.getTestId('consumer-form-custom-id').should('be.visible')
      cy.getTestId('consumer-form-tags').should('be.visible')

      cy.getTestId('consumer-create-form-cancel').should('be.visible')
      cy.getTestId('consumer-create-form-cancel').should('be.enabled')
      cy.getTestId('consumer-create-form-submit').should('be.visible')
      cy.getTestId('consumer-create-form-submit').should('be.disabled')
    })

    it('Submit button should be enabled if only username field is filled in', () => {
      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.getTestId('consumer-create-form-submit').should('be.visible')
      cy.getTestId('consumer-create-form-submit').should('be.disabled')

      cy.getTestId('consumer-form-username').type('Test name')

      cy.getTestId('consumer-create-form-submit').should('be.enabled')
    })

    it('Submit button should be enabled if only customId field is filled in', () => {
      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
        },
      })

      cy.getTestId('consumer-create-form-submit').should('be.visible')
      cy.getTestId('consumer-create-form-submit').should('be.disabled')

      cy.getTestId('consumer-form-custom-id').type('test_id')

      cy.getTestId('consumer-create-form-submit').should('be.enabled')
    })

    it('loading event should be emitted when EntityBaseForm emits loading event', () => {
      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('loading', true)
        cy.get('@onLoadingSpy').should('have.been.calledWith', true)
      })
    })

    it('error event should be emitted when EntityBaseForm emits fetch:error event', () => {
      const expectedError: AxiosError = {
        isAxiosError: false,
        toJSON(): object {
          return {}
        },
        message: 'error',
        name: 'error',
      }

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          onError: cy.spy().as('onErrorSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('fetch:error', expectedError)
        cy.get('@onErrorSpy').should('have.been.calledWith', expectedError)
      })
    })

    it('Data should be passed to fields when EntityBaseForm emits fetch:success event', () => {
      const expectedData: Record<string, any> = {
        username: 'username',
        custom_id: 'custom_id',
        tags: ['tag_1', 'tag_2'],
      }

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('fetch:success', expectedData)

        cy.getTestId('consumer-form-username').should('have.value', expectedData.username)
        cy.getTestId('consumer-form-custom-id').should('have.value', expectedData.custom_id)
        cy.getTestId('consumer-form-tags').should('have.value', expectedData.tags.join(', '))
      })
    })
  })

  describe('Konnect', () => {
    const payload: ConsumerPayload = {
      username: 'username',
      custom_id: '',
      tags: ['tag 1'],
    }
    const interceptCreate = (status = 200, data = payload): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/consumers`,
        },
        {
          statusCode: status,
          body: data,
        },
      ).as('createConsumer')
    }

    const interceptEdit = (status = 200, data = payload): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/consumers/*`,
        },
        {
          statusCode: status,
          body: data,
        },
      ).as('editConsumer')
    }

    const interceptGetData = (expectedConsumer: Record<string, any>): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/consumers/*`,
        },
        {
          statusCode: 200,
          body: expectedConsumer,
        },
      ).as('getData')
    }

    it('Should emit update event after Customer was created', () => {
      interceptCreate()

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@createConsumer')

        cy.get('@updateSpy').should('have.been.calledOnceWith', payload)
      })
    })

    it('Error should be visible when creation fails', () => {
      interceptCreate(400)

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@createConsumer')

        cy.get('@updateSpy').should('not.have.been.called')
        cy.getTestId('form-error').should('be.visible')
      })
    })

    it('Form is hydrated correctly in Edit mode', () => {
      const expectedConsumer = {
        item: {
          id: '1234-1234-asdf-asdf',
          username: 'Consumer 1',
          created_at: 1681745979,
          updated_at: 1681825827,
          tags: ['service_1', 'service_2'],
        },
      }

      interceptGetData(expectedConsumer)

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          consumerId: '1234-1234-asdf-asdf',
        },
      })

      cy.wait('@getData')

      cy.getTestId('consumer-form-username').should('have.value', expectedConsumer.item.username)
      cy.getTestId('consumer-form-custom-id').should('have.value', '')
      cy.getTestId('consumer-form-tags').should('have.value', 'service_1, service_2')
    })

    it('update event should be emitted when Consumer was edited', () => {
      const editedPayload: ConsumerPayload = {
        username: 'Consumer 1',
        custom_id: 'new_id',
        tags: ['service_1'],
      }

      interceptEdit(200, editedPayload)

      cy.mount(ConsumerForm, {
        props: {
          config: konnectConfig,
          consumerId: '1234-1234-asdf-asdf',
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@editConsumer')

        cy.get('@updateSpy').should('have.been.calledOnceWith', editedPayload)
      })
    })
  })

  describe('Kong Manager', () => {
    const payload: ConsumerPayload = {
      username: 'username',
      custom_id: '',
      tags: ['tag 1'],
    }

    const interceptCreate = (status = 200, data = payload): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumers`,
        },
        {
          statusCode: status,
          body: data,
        },
      ).as('createConsumer')
    }

    const interceptEdit = (status = 200, data = payload): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumers/*`,
        },
        {
          statusCode: status,
          body: data,
        },
      ).as('editConsumer')
    }

    const interceptGetData = (expectedConsumer: Record<string, any>): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/consumers/*`,
        },
        {
          statusCode: 200,
          body: expectedConsumer,
        },
      ).as('getData')
    }

    it('Should emit update event after Customer was created', () => {
      interceptCreate()

      cy.mount(ConsumerForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@createConsumer')

        cy.get('@updateSpy').should('have.been.calledOnceWith', payload)
      })
    })

    it('Error should be visible when creation fails', () => {
      interceptCreate(400)

      cy.mount(ConsumerForm, {
        props: {
          config: KMConfig,
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@createConsumer')

        cy.get('@updateSpy').should('not.have.been.called')
        cy.getTestId('form-error').should('be.visible')
      })
    })

    it('Form is hydrated correctly in Edit mode', () => {
      const expectedConsumer = {
        item: {
          id: '1234-1234-asdf-asdf',
          username: 'Consumer 1',
          created_at: 1681745979,
          updated_at: 1681825827,
          tags: ['service_1', 'service_2'],
        },
      }

      interceptGetData(expectedConsumer)

      cy.mount(ConsumerForm, {
        props: {
          config: KMConfig,
          consumerId: '1234-1234-asdf-asdf',
        },
      })

      cy.wait('@getData')

      cy.getTestId('consumer-form-username').should('have.value', expectedConsumer.item.username)
      cy.getTestId('consumer-form-custom-id').should('have.value', '')
      cy.getTestId('consumer-form-tags').should('have.value', 'service_1, service_2')
    })

    it('update event should be emitted when Consumer was edited', () => {
      const editedPayload: ConsumerPayload = {
        username: 'Consumer 1',
        custom_id: 'new_id',
        tags: ['service_1'],
      }

      interceptEdit(200, editedPayload)

      cy.mount(ConsumerForm, {
        props: {
          config: KMConfig,
          consumerId: '1234-1234-asdf-asdf',
          onUpdate: cy.spy().as('updateSpy'),
        },
      }).then(({ wrapper }) => {
        wrapper.findComponent(EntityBaseForm).vm.$emit('submit')

        cy.wait('@editConsumer')

        cy.get('@updateSpy').should('have.been.calledOnceWith', editedPayload)
      })
    })
  })
})
