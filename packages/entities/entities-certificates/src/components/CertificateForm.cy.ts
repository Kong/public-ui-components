// Cypress component test spec file
import type { KongManagerCertificateFormConfig, KonnectCertificateFormConfig } from '../types'
import { certificate1 } from '../../fixtures/mockData'
import CertificateForm from './CertificateForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'certificates-list' }

const baseConfigKonnect:KonnectCertificateFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

const baseConfigKM:KongManagerCertificateFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<CertificateForm />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? certificate1,
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/certificates/validate`,
        },
        {
          statusCode: status,
          body: { },
        },
      ).as('validateCertificate')

      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates/*`,
        },
        {
          statusCode: status,
          body: { ...certificate1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
        },
      })
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('be.visible')
      cy.getTestId('certificate-form-key').should('be.visible')
      cy.getTestId('certificate-form-cert-alt').should('be.visible')
      cy.getTestId('certificate-form-key-alt').should('be.visible')
      cy.getTestId('certificate-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert)
      cy.getTestId('certificate-form-key').type(certificate1.key)
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('certificate-form-cert').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('have.value', certificate1.cert)
      cy.getTestId('certificate-form-key').should('have.value', certificate1.key)
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('certificate-form-cert-alt').type('edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('certificate-form-cert-alt').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load Certificate', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-certificates-form form').should('not.exist')
    })

    it('update event should be emitted when Certificate was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: certificate1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificate')
      cy.getTestId('certificate-form-tags').clear()
      cy.getTestId('certificate-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateCertificate')
      cy.wait('@updateCertificate')

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
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? certificate1,
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/v1/schemas/json/certificate/validate`,
        },
        {
          statusCode: status,
          body: { },
        },
      ).as('validateCertificate')

      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates/*`,
        },
        {
          statusCode: status,
          body: { ...certificate1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('be.visible')
      cy.getTestId('certificate-form-key').should('be.visible')
      cy.getTestId('certificate-form-cert-alt').should('be.visible')
      cy.getTestId('certificate-form-key-alt').should('be.visible')
      cy.getTestId('certificate-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      })
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert)
      cy.getTestId('certificate-form-key').type(certificate1.key)
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('certificate-form-cert').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('have.value', certificate1.cert)
      cy.getTestId('certificate-form-key').should('have.value', certificate1.key)
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('certificate-form-cert-alt').type('edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('certificate-form-cert-alt').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load Certificate', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/control_planes/${baseConfigKonnect.controlPlaneId}/certificates/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: certificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-certificates-form form').should('not.exist')
    })

    it('update event should be emitted when Certificate was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: certificate1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificate')
      cy.getTestId('certificate-form-tags').clear()
      cy.getTestId('certificate-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validateCertificate')
      cy.wait('@updateCertificate')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
