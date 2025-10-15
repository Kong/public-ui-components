// Cypress component test spec file
import type { KongManagerCertificateFormConfig, KonnectCertificateFormConfig } from '../types'
import { caCertificate1 } from '../../fixtures/mockData'
import CACertificateForm from './CACertificateForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'certificates-list' }

const baseConfigKonnect:KonnectCertificateFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

const baseConfigKM:KongManagerCertificateFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<CACertificateForm />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? caCertificate1,
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates/*`,
        },
        {
          statusCode: status,
          body: { ...caCertificate1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
        },
      })
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-ca-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('ca_certificate-create-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-create-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('ca-certificate-form-cert').should('be.visible')
      cy.getTestId('ca-certificate-form-cert-digest').should('be.visible')
      cy.getTestId('ca-certificate-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('ca_certificate-create-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-create-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('ca-certificate-form-cert').type(caCertificate1.cert)
      cy.getTestId('ca_certificate-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('ca-certificate-form-cert').clear()
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKM()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // button state
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('ca-certificate-form-cert').should('have.value', caCertificate1.cert)
    })

    it('should correctly handle button state - edit', () => {
      interceptKM()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('ca-certificate-form-cert-digest').type('edited')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('ca-certificate-form-cert-digest').clear()
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load CA Certificate', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/ca_certificates/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('ca_certificate-edit-form-cancel').should('not.exist')
      cy.getTestId('ca_certificate-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-ca-certificates-form form').should('not.exist')
    })

    it('update event should be emitted when CA Certificate was edited', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKM,
          certificateId: caCertificate1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificate')
      cy.getTestId('ca-certificate-form-tags').clear()
      cy.getTestId('ca-certificate-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/ca_certificates/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? caCertificate1,
        },
      ).as(params?.alias ?? 'getCertificate')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/ca_certificates/*`,
        },
        {
          statusCode: status,
          body: { ...caCertificate1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-ca-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('ca_certificate-create-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-create-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('ca-certificate-form-cert').should('be.visible')
      cy.getTestId('ca-certificate-form-cert-digest').should('be.visible')
      cy.getTestId('ca-certificate-form-tags').should('be.visible')
    })

    it('should correctly handle button state - create', () => {
      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      })
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('ca_certificate-create-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-create-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('ca-certificate-form-cert').type(caCertificate1.cert)
      cy.getTestId('ca_certificate-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('ca-certificate-form-cert').clear()
      cy.getTestId('ca_certificate-create-form-submit').should('be.disabled')
    })

    it('should show edit form', () => {
      interceptKonnect()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // button state
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('ca-certificate-form-cert').should('have.value', caCertificate1.cert)
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnect()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.visible')
      cy.getTestId('ca_certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('ca-certificate-form-cert-digest').type('edited')
      cy.getTestId('ca_certificate-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('ca-certificate-form-cert-digest').clear()
      cy.getTestId('ca_certificate-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load CA Certificate', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/ca_certificates/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getCertificate')

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: caCertificate1.id,
        },
      })

      cy.wait('@getCertificate')
      cy.get('.kong-ui-entities-ca-certificates-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('ca_certificate-create-form-cancel').should('not.exist')
      cy.getTestId('ca_certificate-create-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-ca-certificates-form form').should('not.exist')
    })

    it('update event should be emitted when CA Certificate was edited', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(CACertificateForm, {
        props: {
          config: baseConfigKonnect,
          certificateId: caCertificate1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificate')
      cy.getTestId('ca-certificate-form-tags').clear()
      cy.getTestId('ca-certificate-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateCertificate')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
