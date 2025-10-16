// Cypress component test spec file
import type { KongManagerSniFormConfig, KonnectSniFormConfig } from '../types'
import { sni1, certificates } from '../../fixtures/mockData'
import SniForm from './SniForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'snis-list' }

const baseConfigKonnect: KonnectSniFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api',
  cancelRoute,
}

const baseConfigKM: KongManagerSniFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<SniForm />', {
  // workaround the `ResizeObserver loop completed with undelivered notifications` error
  viewportWidth: 1024,
  viewportHeight: 768,
}, () => {
  describe('Kong Manager', () => {
    const interceptKMCerts = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? certificates,
        },
      ).as(params?.alias ?? 'getCertificates')
    }

    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? sni1,
        },
      ).as(params?.alias ?? 'getSni')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis/*`,
        },
        {
          statusCode: status,
          body: { ...sni1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateSni')
    }

    it('should show create form', () => {
      interceptKMCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.get('.kong-ui-entities-snis-form form').should('be.visible')
      // button state
      cy.getTestId('sni-create-form-cancel').should('be.visible')
      cy.getTestId('sni-create-form-submit').should('be.visible')
      cy.getTestId('sni-create-form-cancel').should('be.enabled')
      cy.getTestId('sni-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('sni-form-name').should('be.visible')
      cy.getTestId('sni-form-tags').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      // certs load in select
      cy.getTestId('sni-form-certificate-id').click()
      cy.getTestId('sni-form-certificate-id').closest('.k-select').find('.select-item').should('have.length', certificates.data.length)
    })

    it('should correctly handle button state - create', () => {
      interceptKMCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // default button state
      cy.getTestId('sni-create-form-cancel').should('be.visible')
      cy.getTestId('sni-create-form-submit').should('be.visible')
      cy.getTestId('sni-create-form-cancel').should('be.enabled')
      cy.getTestId('sni-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('sni-form-name').type('tk-meowstersmith')
      cy.getTestId('sni-form-certificate-id').click()
      cy.get(`[data-testid="select-item-${certificates.data[0].id}"] button`).click()
      cy.getTestId('sni-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('sni-form-name').clear()
      cy.getTestId('sni-create-form-submit').should('be.disabled')
    })

    it('should allow exact match filtering of certs', () => {
      interceptKMCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // search
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').type(sni1.certificate.id)
      // click kselect item
      cy.getTestId(`select-item-${sni1.certificate.id}`).should('be.visible')
      cy.get(`[data-testid="select-item-${sni1.certificate.id}"] button`).click()
      cy.getTestId('sni-form-certificate-id').should('have.value', sni1.certificate.id)
    })

    it('should set cert selection as readonly if provided in config - on create', () => {
      interceptKMCerts()

      cy.mount(SniForm, {
        props: {
          config: {
            ...baseConfigKM,
            certificateId: '1234-cats-beat-certs',
          },
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // search
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('have.attr', 'readonly')
    })

    it('should not set cert selection as readonly if provided in config - on edit', () => {
      interceptKMCerts()
      interceptKM()

      cy.mount(SniForm, {
        props: {
          config: {
            ...baseConfigKM,
            certificateId: '1234-cats-beat-certs',
          },
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('not.have.attr', 'readonly')
    })

    it('should show edit form', () => {
      interceptKMCerts()
      interceptKM()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // button state
      cy.getTestId('sni-edit-form-cancel').should('be.visible')
      cy.getTestId('sni-edit-form-submit').should('be.visible')
      cy.getTestId('sni-edit-form-cancel').should('be.enabled')
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('sni-form-name').should('have.value', sni1.name)
      sni1.tags.forEach((tag: string) => {
        cy.getTestId('sni-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('sni-form-certificate-id').should('have.value', sni1.certificate.id)
    })

    it('should correctly handle button state - edit', () => {
      interceptKMCerts()
      interceptKM()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
          sniId: sni1.id,
        },
      })

      cy.wait('@getSni')
      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // default button state
      cy.getTestId('sni-edit-form-cancel').should('be.visible')
      cy.getTestId('sni-edit-form-submit').should('be.visible')
      cy.getTestId('sni-edit-form-cancel').should('be.enabled')
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('sni-form-name').type('-edited')
      cy.getTestId('sni-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('sni-form-name').clear()
      cy.getTestId('sni-form-name').type(sni1.name)
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load SNI', () => {
      interceptKMCerts()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/snis/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getSni')

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('sni-edit-form-cancel').should('not.exist')
      cy.getTestId('sni-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-snis-form form').should('not.exist')
    })

    it('should handle error state - failed to load certs', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/certificates*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getCertificates')

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should handle error state - invalid cert id', () => {
      interceptKMCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('sni-form-certificate-id').type('xxxx')
      cy.getTestId('no-search-results').should('be.visible')
      cy.getTestId('invalid-certificate-message').should('exist')
    })

    it('update event should be emitted when Sni was edited', () => {
      interceptKMCerts()
      interceptKM()
      interceptUpdate()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKM,
          sniId: sni1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.getTestId('sni-form-tags').clear()
      cy.getTestId('sni-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateSni')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })

  describe('Konnect', () => {
    const interceptKonnectCerts = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? certificates,
        },
      ).as(params?.alias ?? 'getCertificates')
    }

    const interceptKonnect = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? sni1,
        },
      ).as(params?.alias ?? 'getSni')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis/*`,
        },
        {
          statusCode: status,
          body: { ...sni1, tags: ['tag1', 'tag2'] },
        },
      ).as('updateSni')
    }

    it('should show create form', () => {
      interceptKonnectCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.get('.kong-ui-entities-snis-form form').should('be.visible')
      // button state
      cy.getTestId('sni-create-form-cancel').should('be.visible')
      cy.getTestId('sni-create-form-submit').should('be.visible')
      cy.getTestId('sni-create-form-cancel').should('be.enabled')
      cy.getTestId('sni-create-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('sni-form-name').should('be.visible')
      cy.getTestId('sni-form-tags').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      // certs load in select
      cy.getTestId('sni-form-certificate-id').click()
      cy.getTestId('sni-form-certificate-id').closest('.k-select').find('.select-item').should('have.length', certificates.data.length)
    })

    it('should correctly handle button state - create', () => {
      interceptKonnectCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // default button state
      cy.getTestId('sni-create-form-cancel').should('be.visible')
      cy.getTestId('sni-create-form-submit').should('be.visible')
      cy.getTestId('sni-create-form-cancel').should('be.enabled')
      cy.getTestId('sni-create-form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('sni-form-name').type('tk-meowstersmith')
      cy.getTestId('sni-form-certificate-id').click()
      cy.get(`[data-testid="select-item-${certificates.data[0].id}"] button`).click()
      cy.getTestId('sni-create-form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('sni-form-name').clear()
      cy.getTestId('sni-create-form-submit').should('be.disabled')
    })

    it('should allow exact match filtering of certs', () => {
      interceptKonnectCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // search
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').type(sni1.certificate.id)
      // click kselect item
      cy.getTestId(`select-item-${sni1.certificate.id}`).should('be.visible')
      cy.get(`[data-testid="select-item-${sni1.certificate.id}"] button`).click()
      cy.getTestId('sni-form-certificate-id').should('have.value', sni1.certificate.id)
    })

    it('should set cert selection as readonly if provided in config - on create', () => {
      interceptKonnectCerts()

      cy.mount(SniForm, {
        props: {
          config: {
            ...baseConfigKonnect,
            certificateId: '1234-cats-beat-certs',
          },
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('have.attr', 'readonly')
    })

    it('should not set cert selection as readonly if provided in config - on edit', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(SniForm, {
        props: {
          config: {
            ...baseConfigKonnect,
            certificateId: '1234-cats-beat-certs',
          },
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('be.visible')
      cy.getTestId('sni-form-certificate-id').should('not.have.attr', 'readonly')
    })

    it('should show edit form', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // button state
      cy.getTestId('sni-edit-form-cancel').should('be.visible')
      cy.getTestId('sni-edit-form-submit').should('be.visible')
      cy.getTestId('sni-edit-form-cancel').should('be.enabled')
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
      // form fields
      cy.getTestId('sni-form-name').should('have.value', sni1.name)
      sni1.tags.forEach((tag: string) => {
        cy.getTestId('sni-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('sni-form-certificate-id').should('have.value', sni1.certificate.id)
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
          sniId: sni1.id,
        },
      })

      cy.wait('@getSni')
      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // default button state
      cy.getTestId('sni-edit-form-cancel').should('be.visible')
      cy.getTestId('sni-edit-form-submit').should('be.visible')
      cy.getTestId('sni-edit-form-cancel').should('be.enabled')
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('sni-form-name').type('-edited')
      cy.getTestId('sni-edit-form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('sni-form-name').clear()
      cy.getTestId('sni-form-name').type(sni1.name)
      cy.getTestId('sni-edit-form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load SNI', () => {
      interceptKonnectCerts()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/snis/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getSni')

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
          sniId: sni1.id,
        },
      })

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('sni-edit-form-cancel').should('not.exist')
      cy.getTestId('sni-edit-form-submit').should('not.exist')
      cy.get('.kong-ui-entities-snis-form form').should('not.exist')
    })

    it('should handle error state - failed to load certs', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/certificates*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getCertificates')

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should handle error state - invalid cert id', () => {
      interceptKonnectCerts()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.wait('@getCertificates')
      cy.get('.kong-ui-entities-snis-form').should('be.visible')
      cy.getTestId('sni-form-certificate-id').type('xxxx')
      cy.getTestId('no-search-results').should('be.visible')
      cy.getTestId('invalid-certificate-message').should('exist')
    })

    it('update event should be emitted when Sni was edited', () => {
      interceptKonnectCerts()
      interceptKonnect()
      interceptUpdate()

      cy.mount(SniForm, {
        props: {
          config: baseConfigKonnect,
          sniId: sni1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getCertificates')
      cy.wait('@getSni')
      cy.getTestId('sni-form-tags').clear()
      cy.getTestId('sni-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@updateSni')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
