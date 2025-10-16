// Cypress component test spec file
import { EntityBaseForm } from '@kong-ui-public/entities-shared'
import type { CyHttpMessages, RouteHandler } from 'cypress/types/net-stubbing'
import { certificate1, secp384r1CertKeyPair } from '../../fixtures/mockData'
import type { KongManagerCertificateFormConfig, KonnectCertificateFormConfig } from '../types'
import CertificateForm from './CertificateForm.vue'

const cancelRoute = { name: 'certificates-list' }
const sniListRoute = { name: 'snis-list' }

const baseConfigKonnect: KonnectCertificateFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
  sniListRoute,
}

const baseConfigKM: KongManagerCertificateFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
  sniListRoute,
}

/**
 * This function roughly checks if the given string is probably a PEM string with newlines.
 */
const checkInvalidPEM = (raw: string): boolean => {
  return raw.startsWith('-----') && !raw.includes('\n')
}

const badRequest = {
  statusCode: 400,
  body: { },
}

const handleCertificateCreateUpdate = (onSuccess: (request: CyHttpMessages.IncomingHttpRequest) => any): RouteHandler => (request) => {
  const { body } = request
  const { cert, key, cert_alt: certAlt, key_alt: keyAlt } = body ?? {}

  if (typeof cert !== 'string' || typeof key !== 'string' || cert.length === 0 || key.length === 0) {
    return request.reply(badRequest)
  }

  if ([cert, key].some((r) => checkInvalidPEM(r))) {
    return request.reply(badRequest)
  }

  // certAlt and keyAlt should be both empty or both non-empty
  if ((typeof certAlt === 'string' && certAlt.length > 0) !== (typeof keyAlt === 'string' && keyAlt.length > 0)) {
    return request.reply(badRequest)
  } else if ((typeof certAlt === 'string' && certAlt.length > 0) && (typeof keyAlt === 'string' && keyAlt.length > 0)) {
    if ([certAlt, keyAlt].some((r) => checkInvalidPEM(r))) {
      return request.reply(badRequest)
    }
  }

  return onSuccess(request)
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
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates`,
        },
        handleCertificateCreateUpdate((request) => {
          request.reply({
            statusCode: status,
            body: request.body,
          })
        }),
      ).as('createCertificate')

      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates/*`,
        },
        handleCertificateCreateUpdate((request) => {
          request.reply({
            statusCode: status,
            body: request.body,
          })
        }),
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          showSnisField: true,
        },
      })
      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('be.visible')
      cy.getTestId('certificate-form-key').should('be.visible')
      cy.getTestId('certificate-form-cert-alt').should('be.visible')
      cy.getTestId('certificate-form-key-alt').should('be.visible')
      cy.getTestId('sni-field-input-1').should('be.visible')
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
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })
      cy.getTestId('certificate-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('certificate-form-cert').clear()
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
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
      cy.getTestId('certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('certificate-edit-form-submit').should('be.visible')
      cy.getTestId('certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
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
      cy.getTestId('certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('certificate-edit-form-submit').should('be.visible')
      cy.getTestId('certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('certificate-form-cert-alt').type('edited')
      cy.getTestId('certificate-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('certificate-form-cert-alt').clear()
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
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
      cy.getTestId('certificate-edit-form-cancel').should('not.exist')
      cy.getTestId('certificate-edit-form-submit').should('not.exist')
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

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateCertificate')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })

    it('should fail with malformed cert_alt and key_alt', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })

      // replaces all the newlines with spaces; this should fail the validation
      cy.getTestId('certificate-form-cert-alt').type(secp384r1CertKeyPair.cert.replaceAll('\n', ' '), { delay: 0 })
      cy.getTestId('certificate-form-key-alt').type(secp384r1CertKeyPair.key.replaceAll('\n', ' '), { delay: 0 })

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 400)
    })

    it('should not fail with valid cert_alt and key_alt', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })

      // replaces all the newlines with spaces; this should fail the validation
      cy.getTestId('certificate-form-cert-alt').type(secp384r1CertKeyPair.cert, { delay: 0 })
      cy.getTestId('certificate-form-key-alt').type(secp384r1CertKeyPair.key, { delay: 0 })

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 200)
    })

    it('should not fail when SNI is provided', () => {
      interceptKM()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKM,
          showSnisField: true,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })
      cy.getTestId('sni-field-input-1').type('foo')

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 200)
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates/*`,
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
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates`,
        },
        handleCertificateCreateUpdate((request) => {
          request.reply({
            statusCode: status,
            body: request.body,
          })
        }),
      ).as('createCertificate')

      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates/*`,
        },
        handleCertificateCreateUpdate((request) => {
          request.reply({
            statusCode: status,
            body: request.body,
          })
        }),
      ).as('updateCertificate')
    }

    it('should show create form', () => {
      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          showSnisField: true,
        },
      })

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      cy.get('.kong-ui-entities-certificates-form form').should('be.visible')
      // button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('certificate-form-cert').should('be.visible')
      cy.getTestId('certificate-form-key').should('be.visible')
      cy.getTestId('certificate-form-cert-alt').should('be.visible')
      cy.getTestId('certificate-form-key-alt').should('be.visible')
      cy.getTestId('sni-field-input-1').should('be.visible')
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
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })
      cy.getTestId('certificate-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('certificate-form-cert').clear()
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
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
      cy.getTestId('certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('certificate-edit-form-submit').should('be.visible')
      cy.getTestId('certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
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
      cy.getTestId('certificate-edit-form-cancel').should('be.visible')
      cy.getTestId('certificate-edit-form-submit').should('be.visible')
      cy.getTestId('certificate-edit-form-cancel').should('be.enabled')
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('certificate-form-cert-alt').type('edited')
      cy.getTestId('certificate-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('certificate-form-cert-alt').clear()
      cy.getTestId('certificate-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load Certificate', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates/*`,
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
      cy.getTestId('certificate-edit-form-cancel').should('not.exist')
      cy.getTestId('certificate-edit-form-submit').should('not.exist')
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

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateCertificate')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })

    it('should fail with malformed cert_alt and key_alt', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })

      // replaces all the newlines with spaces; this should fail the validation
      cy.getTestId('certificate-form-cert-alt').type(secp384r1CertKeyPair.cert.replaceAll('\n', ' '), { delay: 0 })
      cy.getTestId('certificate-form-key-alt').type(secp384r1CertKeyPair.key.replaceAll('\n', ' '), { delay: 0 })

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 400)
    })

    it('should not fail with valid cert_alt and key_alt', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })

      // replaces all the newlines with spaces; this should fail the validation
      cy.getTestId('certificate-form-cert-alt').type(secp384r1CertKeyPair.cert, { delay: 0 })
      cy.getTestId('certificate-form-key-alt').type(secp384r1CertKeyPair.key, { delay: 0 })

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 200)
    })

    it('should not fail when SNI is provided', () => {
      interceptKonnect()
      interceptUpdate()

      cy.mount(CertificateForm, {
        props: {
          config: baseConfigKonnect,
          showSnisField: true,
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('.kong-ui-entities-certificates-form').should('be.visible')
      // default button state
      cy.getTestId('certificate-create-form-cancel').should('be.visible')
      cy.getTestId('certificate-create-form-submit').should('be.visible')
      cy.getTestId('certificate-create-form-cancel').should('be.enabled')
      cy.getTestId('certificate-create-form-submit').should('be.disabled')
      cy.getTestId('certificate-form-cert').type(certificate1.cert, { delay: 0 })
      cy.getTestId('certificate-form-key').type(certificate1.key, { delay: 0 })
      cy.getTestId('sni-field-input-1').type('foo')

      cy.getTestId('certificate-create-form-submit').should('be.enabled')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@createCertificate').its('response.statusCode').should('eq', 200)
    })
  })
})
