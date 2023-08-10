// Cypress component test spec file
import { KongManagerKeySetFormConfig, KonnectKeySetFormConfig } from '../types'
import { keySet1 } from '../../fixtures/mockData'
import KeySetForm from './KeySetForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'keys-list' }

const baseConfigKonnect: KonnectKeySetFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

const baseConfigKM: KongManagerKeySetFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<KeySetForm />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/key-sets/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? keySet1,
        },
      ).as(params?.alias ?? 'getKeySet')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/key-sets/*`,
        },
        {
          statusCode: status,
          body: { ...keySet1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateKeySet')
    }

    it('should show create form', () => {
      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      cy.get('.kong-ui-entities-key-sets-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('key-set-form-name').should('be.visible')
      cy.getTestId('key-set-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('key-set-form-name').type('my-key-set')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('key-set-form-name').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySet')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('key-set-form-name').should('have.value', keySet1.name)
      keySet1.tags.forEach((tag: string) => {
        cy.getTestId('key-set-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySet')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('key-set-form-name').type('-edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('key-set-form-name').clear()
      cy.getTestId('key-set-form-name').type(keySet1.name)
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load Key Set', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/key-sets/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getKeySetError')

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySetError')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-key-sets-form form').should('not.exist')
    })

    it('update event should be emitted when Key Set was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKM,
          keySetId: keySet1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getKeySet')
      cy.getTestId('key-set-form-tags').clear()
      cy.getTestId('key-set-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateKeySet')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })

  describe('Konnect', () => {
    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/key-sets/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? keySet1,
        },
      ).as(params?.alias ?? 'getKeySet')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/key-sets/*`,
        },
        {
          statusCode: status,
          body: { ...keySet1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateKeySet')
    }

    it('should show create form', () => {
      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      cy.get('.kong-ui-entities-key-sets-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('key-set-form-name').should('be.visible')
      cy.getTestId('key-set-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('key-set-form-name').type('my-key-set')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('key-set-form-name').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySet')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('key-set-form-name').should('have.value', keySet1.name)
      keySet1.tags.forEach((tag: string) => {
        cy.getTestId('key-set-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySet')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('key-set-form-name').type('-edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('key-set-form-name').clear()
      cy.getTestId('key-set-form-name').type(keySet1.name)
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load Key Set', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/key-sets/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getKeySetError')

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
          keySetId: keySet1.id,
        },
      })

      cy.wait('@getKeySetError')
      cy.get('.kong-ui-entities-key-sets-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-key-sets-form form').should('not.exist')
    })

    it('update event should be emitted when Key Set was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(KeySetForm, {
        props: {
          config: baseConfigKonnect,
          keySetId: keySet1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getKeySet')
      cy.getTestId('key-set-form-tags').clear()
      cy.getTestId('key-set-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateKeySet')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
