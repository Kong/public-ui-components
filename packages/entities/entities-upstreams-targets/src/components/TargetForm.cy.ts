// Cypress component test spec file
import type { KongManagerTargetFormConfig, KonnectTargetFormConfig } from '../types'
import TargetForm from './TargetForm.vue'
import { target } from '../../fixtures/mockData'
import { AppType } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'view-upstream' }
const upstreamId = '12345-qwerty'

const baseConfigKonnect:KonnectTargetFormConfig = {
  app: AppType.Konnect,
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
  upstreamId,
}

const baseConfigKM:KongManagerTargetFormConfig = {
  app: AppType.KongManager,
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
  upstreamId,
}

describe('<TargetForm />', { viewportHeight: 700, viewportWidth: 700 }, () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${upstreamId}/targets/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? target,
        },
      ).as(params?.alias ?? 'getTarget')
    }

    it('should show create form', () => {
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      cy.get('.kong-ui-entities-target-form form').should('be.visible')
      // button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // form fields
      cy.getTestId('target-form-target').should('be.visible')
      cy.getTestId('target-form-weight').should('be.visible')
      cy.getTestId('target-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('target-form-target').type('bicycle-kick')
      cy.getTestId('target-form-weight').clear()
      cy.getTestId('target-form-weight').type('101')
      cy.getTestId('modal-action-button').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('target-form-target').clear()
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // form fields
      cy.getTestId('target-form-target').should('have.value', target.target)
      cy.getTestId('target-form-weight').should('have.value', target.weight)
      target.tags.forEach((tag: string) => {
        cy.getTestId('target-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('target-form-target').type('ubiquitous')
      cy.getTestId('modal-action-button').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('target-form-target').clear()
      cy.getTestId('target-form-target').type(target.target)
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should handle error state - failed to load target', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/upstreams/${upstreamId}/targets/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getTarget')

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // form hidden
      cy.get('.kong-ui-entities-target-form form').should('not.exist')
    })

    it('should render info slot content when provided', () => {
      const infoSlotContent = 'Info slot content'
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKM,
          isVisible: true,
        },
        slots: {
          info: `<div data-testid="info-slot">${infoSlotContent}</div>`,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      cy.getTestId('info-slot').should('be.visible').should('contain', infoSlotContent)
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${upstreamId}/targets/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? target,
        },
      ).as(params?.alias ?? 'getTarget')
    }

    it('should show create form', () => {
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      cy.get('.kong-ui-entities-target-form form').should('be.visible')
      // button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // form fields
      cy.getTestId('target-form-target').should('be.visible')
      cy.getTestId('target-form-weight').should('be.visible')
      cy.getTestId('target-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('target-form-target').type('bicycle-kick')
      cy.getTestId('target-form-weight').clear()
      cy.getTestId('target-form-weight').type('101')
      cy.getTestId('modal-action-button').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('target-form-target').clear()
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // form fields
      cy.getTestId('target-form-target').should('have.value', target.target)
      cy.getTestId('target-form-weight').should('have.value', target.weight)
      target.tags.forEach((tag: string) => {
        cy.getTestId('target-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // default button state
      cy.getTestId('modal-cancel-button').should('be.visible')
      cy.getTestId('modal-action-button').should('be.visible')
      cy.getTestId('modal-cancel-button').should('be.enabled')
      cy.getTestId('modal-action-button').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('target-form-target').type('ubiquitous')
      cy.getTestId('modal-action-button').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('target-form-target').clear()
      cy.getTestId('target-form-target').type(target.target)
      cy.getTestId('modal-action-button').should('be.disabled')
    })

    it('should handle error state - failed to load target', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/upstreams/${upstreamId}/targets/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getTarget')

      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
          targetId: target.id,
        },
      })

      cy.wait('@getTarget')
      cy.get('.kong-ui-entities-target-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // form hidden
      cy.get('.kong-ui-entities-target-form form').should('not.exist')
    })

    it('should render info slot content when provided', () => {
      const infoSlotContent = 'Info slot content'
      cy.mount(TargetForm, {
        props: {
          config: baseConfigKonnect,
          isVisible: true,
        },
        slots: {
          info: `<div data-testid="info-slot">${infoSlotContent}</div>`,
        },
      })

      cy.get('.kong-ui-entities-target-form').should('be.visible')
      cy.getTestId('info-slot').should('be.visible').should('contain', infoSlotContent)
    })
  })
})
