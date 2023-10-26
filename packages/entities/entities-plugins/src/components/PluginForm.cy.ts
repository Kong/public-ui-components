// Cypress component test spec file
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'
import { plugin1 } from '../../fixtures/mockData'
import PluginForm from './PluginForm.vue'
import { EntityBaseForm } from '@kong-ui-public/entities-shared'

const cancelRoute = { name: 'plugins-list' }

const baseConfigKonnect:KonnectPluginFormConfig = {
  app: 'konnect',
  controlPlaneId: '1234-abcd-ilove-cats',
  apiBaseUrl: '/us/kong-api/konnect-api',
  cancelRoute,
}

const baseConfigKM:KongManagerPluginFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cancelRoute,
}

describe('<PluginForm />', () => {
  describe('Kong Manager', () => {
    const interceptKM = (params?: {
      mockData?: object
      alias?: string
    }) => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'getPlugin')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/schemas/plugins/validate`,
        },
        {
          statusCode: status,
          body: { },
        },
      ).as('validatePlugin')

      cy.intercept(
        {
          method: 'PATCH',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins/*`,
        },
        {
          statusCode: status,
          body: { ...plugin1, tags: ['tag1', 'tag2'] },
        },
      ).as('updatePlugin')
    }

    it('should show create form', () => {

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.get('.kong-ui-entities-plugins-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('plugin-form-name').should('be.visible')
      cy.getTestId('plugin-form-tags').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      // certs load in select
      cy.getTestId('plugin-form-certificate-id').click()
      cy.get('.k-select-list .k-select-item').should('have.length', certificates.data.length)
    })

    it('should correctly handle button state - create', () => {

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('plugin-form-name').type('tk-meowstersmith')
      cy.getTestId('plugin-form-certificate-id').click()
      cy.get(`[data-testid="k-select-item-${certificates.data[0].id}"] button`).click()
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('plugin-form-name').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should allow exact match filtering of certs', () => {

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // search
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').type(plugin1.certificate.id)
      // click kselect item
      cy.getTestId(`k-select-item-${plugin1.certificate.id}`).should('be.visible')
      cy.get(`[data-testid="k-select-item-${plugin1.certificate.id}"] button`).click()
      cy.getTestId('plugin-form-certificate-id').should('have.value', plugin1.certificate.id)
    })

    it('should set cert selection as readonly if provided in config - on create', () => {

      cy.mount(PluginForm, {
        props: {
          config: {
            ...baseConfigKM,
            certificateId: '1234-cats-beat-certs',
          },
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // search
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('have.attr', 'readonly')
    })

    it('should not set cert selection as readonly if provided in config - on edit', () => {

      interceptKM()

      cy.mount(PluginForm, {
        props: {
          config: {
            ...baseConfigKM,
            certificateId: '1234-cats-beat-certs',
          },
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('not.have.attr', 'readonly')
    })

    it('should show edit form', () => {

      interceptKM()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('plugin-form-name').should('have.value', plugin1.name)
      plugin1.tags.forEach((tag: string) => {
        cy.getTestId('plugin-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('plugin-form-certificate-id').should('have.value', plugin1.certificate.id)
    })

    it('should correctly handle button state - edit', () => {

      interceptKM()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('plugin-form-name').type('-edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('plugin-form-name').clear()
      cy.getTestId('plugin-form-name').type(plugin1.name)
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load plugin', () => {

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/plugins/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getPlugin')

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-plugins-form form').should('not.exist')
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

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should handle error state - invalid cert id', () => {

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').type('xxxx')
      cy.getTestId('no-search-results').should('be.visible')
      cy.getTestId('invalid-certificate-message').should('exist')
    })

    it('update event should be emitted when plugin was edited', () => {

      interceptKM()
      interceptUpdate()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKM,
          pluginId: plugin1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getPlugin')
      cy.getTestId('plugin-form-tags').clear()
      cy.getTestId('plugin-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validatePlugin')
      cy.wait('@updatePlugin')

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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/certificates*`,
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
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins/*`,
        },
        {
          statusCode: 200,
          body: params?.mockData ?? plugin1,
        },
      ).as(params?.alias ?? 'getPlugin')
    }

    const interceptUpdate = (status = 200): void => {
      cy.intercept(
        {
          method: 'POST',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/v1/schemas/json/plugin/validate`,
        },
        {
          statusCode: status,
          body: { },
        },
      ).as('validatePlugin')

      cy.intercept(
        {
          method: 'PUT',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins/*`,
        },
        {
          statusCode: status,
          body: { ...plugin1, tags: ['tag1', 'tag2'] },
        },
      ).as('updatePlugin')
    }

    it('should show create form', () => {
      interceptKonnectCerts()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.get('.kong-ui-entities-plugins-form form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('plugin-form-name').should('be.visible')
      cy.getTestId('plugin-form-tags').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      // certs load in select
      cy.getTestId('plugin-form-certificate-id').click()
      cy.get('.k-select-list .k-select-item').should('have.length', certificates.data.length)
    })

    it('should correctly handle button state - create', () => {
      interceptKonnectCerts()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when required fields have values
      cy.getTestId('plugin-form-name').type('tk-meowstersmith')
      cy.getTestId('plugin-form-certificate-id').click()
      cy.get(`[data-testid="k-select-item-${certificates.data[0].id}"] button`).click()
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when required field is cleared
      cy.getTestId('plugin-form-name').clear()
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should allow exact match filtering of certs', () => {
      interceptKonnectCerts()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // search
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').type(plugin1.certificate.id)
      // click kselect item
      cy.getTestId(`k-select-item-${plugin1.certificate.id}`).should('be.visible')
      cy.get(`[data-testid="k-select-item-${plugin1.certificate.id}"] button`).click()
      cy.getTestId('plugin-form-certificate-id').should('have.value', plugin1.certificate.id)
    })

    it('should set cert selection as readonly if provided in config - on create', () => {
      interceptKonnectCerts()

      cy.mount(PluginForm, {
        props: {
          config: {
            ...baseConfigKonnect,
            certificateId: '1234-cats-beat-certs',
          },
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('have.attr', 'readonly')
    })

    it('should not set cert selection as readonly if provided in config - on edit', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(PluginForm, {
        props: {
          config: {
            ...baseConfigKonnect,
            certificateId: '1234-cats-beat-certs',
          },
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').should('not.have.attr', 'readonly')
    })

    it('should show edit form', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // form fields
      cy.getTestId('plugin-form-name').should('have.value', plugin1.name)
      plugin1.tags.forEach((tag: string) => {
        cy.getTestId('plugin-form-tags').invoke('val').then((val: string) => {
          expect(val).to.contain(tag)
        })
      })
      cy.getTestId('plugin-form-certificate-id').should('have.value', plugin1.certificate.id)
    })

    it('should correctly handle button state - edit', () => {
      interceptKonnectCerts()
      interceptKonnect()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // default button state
      cy.getTestId('form-cancel').should('be.visible')
      cy.getTestId('form-submit').should('be.visible')
      cy.getTestId('form-cancel').should('be.enabled')
      cy.getTestId('form-submit').should('be.disabled')
      // enables save when form has changes
      cy.getTestId('plugin-form-name').type('-edited')
      cy.getTestId('form-submit').should('be.enabled')
      // disables save when form changes are undone
      cy.getTestId('plugin-form-name').clear()
      cy.getTestId('plugin-form-name').type(plugin1.name)
      cy.getTestId('form-submit').should('be.disabled')
    })

    it('should handle error state - failed to load plugin', () => {
      interceptKonnectCerts()

      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/plugins/*`,
        },
        {
          statusCode: 404,
          body: {},
        },
      ).as('getPlugin')

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginId: plugin1.id,
        },
      })

      cy.wait('@getPlugin')
      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      // error state is displayed
      cy.getTestId('form-fetch-error').should('be.visible')
      // buttons and form hidden
      cy.getTestId('form-cancel').should('not.exist')
      cy.getTestId('form-submit').should('not.exist')
      cy.get('.kong-ui-entities-plugins-form form').should('not.exist')
    })

    it('should handle error state - failed to load certs', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${baseConfigKonnect.apiBaseUrl}/api/runtime_groups/${baseConfigKonnect.controlPlaneId}/certificates*`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('getCertificates')

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('form-error').should('be.visible')
    })

    it('should handle error state - invalid cert id', () => {
      interceptKonnectCerts()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
        },
      })

      cy.get('.kong-ui-entities-plugins-form').should('be.visible')
      cy.getTestId('plugin-form-certificate-id').type('xxxx')
      cy.getTestId('no-search-results').should('be.visible')
      cy.getTestId('invalid-certificate-message').should('exist')
    })

    it('update event should be emitted when plugin was edited', () => {
      interceptKonnectCerts()
      interceptKonnect()
      interceptUpdate()

      cy.mount(PluginForm, {
        props: {
          config: baseConfigKonnect,
          pluginId: plugin1.id,
          onUpdate: cy.spy().as('onUpdateSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.wait('@getPlugin')
      cy.getTestId('plugin-form-tags').clear()
      cy.getTestId('plugin-form-tags').type('tag1,tag2')

      cy.get('@vueWrapper').then((wrapper: any) => wrapper.findComponent(EntityBaseForm)
        .vm.$emit('submit'))

      cy.wait('@validatePlugin')
      cy.wait('@updatePlugin')

      cy.get('@onUpdateSpy').should('have.been.calledOnce')
    })
  })
})
