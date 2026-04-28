// Cypress component test spec file
import { h } from 'vue'
import type { KonnectBaseFormConfig } from '../../types'
import { SupportedEntityType } from '../../types'
import EntityBaseForm from './EntityBaseForm.vue'
import { route } from '../../../fixtures/mockData'

describe('<EntityBaseForm />', () => {
  const controlPlaneId = '123abc-ilove-cats'
  const config: KonnectBaseFormConfig = {
    app: 'konnect',
    apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
    // Set the root `.env.development.local` variable to a control plane your PAT can access
    controlPlaneId,
    cancelRoute: { name: '/' },
    enableDeckTab: true,
  }
  const editId = '1234-ideclare-athumb-war'
  const fetchUrl = `/v2/control-planes/${config.controlPlaneId}/core-entities/routes/{id}`
  const entityType = SupportedEntityType.Route

  it('disables save button when canSubmit is false', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: false,
      },
    })

    cy.getTestId(`${entityType}-create-form-cancel`).should('be.visible')
    cy.getTestId(`${entityType}-create-form-submit`).should('be.visible')

    cy.getTestId(`${entityType}-create-form-cancel`).should('be.enabled')
    cy.getTestId(`${entityType}-create-form-submit`).should('be.disabled')
  })

  it('disables save and cancel when isReadonly is true', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
        isReadonly: true,
      },
    })

    cy.getTestId(`${entityType}-create-form-cancel`).should('be.visible')
    cy.getTestId(`${entityType}-create-form-submit`).should('be.visible')

    cy.getTestId(`${entityType}-create-form-cancel`).should('be.disabled')
    cy.getTestId(`${entityType}-create-form-submit`).should('be.disabled')
  })

  it('renders custom button text when provided', () => {
    const saveText = 'custom save'
    const cancelText = 'custom cancel'

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
        saveButtonText: saveText,
        cancelButtonText: cancelText,
      },
    })

    cy.getTestId(`${entityType}-create-form-cancel`).should('be.visible')
    cy.getTestId(`${entityType}-create-form-submit`).should('be.visible')

    cy.getTestId(`${entityType}-create-form-cancel`).should('contain.text', cancelText)
    cy.getTestId(`${entityType}-create-form-submit`).should('contain.text', saveText)
  })

  it('displays View Configuration and Slideout when opened', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
      },
    })

    cy.getTestId(`${entityType}-create-form-view-configuration`).should('be.visible')
    cy.getTestId(`${entityType}-create-form-view-configuration`).click()

    cy.getTestId('form-view-configuration-slideout').should('exist')
    cy.getTestId('form-view-configuration-slideout-tabs').should('exist')
    cy.get('.json-config').should('exist')
    cy.getTestId('deck-tab').should('exist')
  })

  it('displays slotted message in configuration slideout when provided', () => {
    const slottedElementTestId = 'custom-slideout-message'

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
      },
      slots: {
        'configuration-slideout-message': `<p data-testid="${slottedElementTestId}">This is a custom slideout message</p>`,
      },
    })

    cy.getTestId(`${entityType}-create-form-view-configuration`).should('be.visible')
    cy.getTestId(`${entityType}-create-form-view-configuration`).click()

    cy.getTestId('form-view-configuration-slideout').should('exist')
    cy.getTestId(slottedElementTestId).should('exist')
  })

  it('displays error message when provided', () => {
    const error = 'Beware! Here there be errors'

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        errorMessage: error,
      },
    })

    cy.getTestId('form-error').should('be.visible')
    cy.getTestId('form-error').should('contain.text', error)
  })

  it('handles edit flow when load is successful', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/routes/${editId}`,
      },
      {
        statusCode: 200,
        body: {},
      },
    )

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
        editId,
        fetchUrl,
      },
    })

    cy.getTestId('form-fetch-error').should('not.exist')
    cy.getTestId(`${entityType}-edit-form-cancel`).should('be.visible')
    cy.getTestId(`${entityType}-edit-form-submit`).should('be.visible')

    cy.getTestId(`${entityType}-edit-form-cancel`).should('be.enabled')
    cy.getTestId(`${entityType}-edit-form-submit`).should('be.enabled')
  })

  it('handles edit flow when load is unsuccessful', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/routes/${editId}`,
      },
      {
        statusCode: 500,
        body: {},
      },
    )

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
        canSubmit: true,
        editId,
        fetchUrl,
      },
    })

    cy.getTestId('form-fetch-error').should('be.visible')
    cy.getTestId(`${entityType}-edit-form-cancel`).should('not.exist')
    cy.getTestId(`${entityType}-edit-form-submit`).should('not.exist')
  })

  it('should show slot content', () => {
    const content = 'Look Mah! I iz form!'
    const action = 'Continue?'

    cy.mount(EntityBaseForm, {
      props: {
        config,
        formFields: route,
        entityType,
      },
      slots: {
        default: h('span', content),
        'form-actions': h('span', action),
      },
    })

    cy.getTestId('form-content').should('contain.text', content)
    cy.getTestId('form-actions').should('contain.text', action)
  })

  describe('Konnect workspace URL building', () => {
    const wsControlPlaneId = '123abc-ilove-cats'
    const wsEditId = '1234-ideclare-athumb-war'
    const wsBaseUrl = '/us/kong-api'
    const wsEntityType = SupportedEntityType.Route

    // fetchUrl with {controlPlaneId} and {workspace} placeholders (realistic endpoint format)
    const workspaceFetchUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}/routes/{id}'
    // fetchUrl without {workspace} placeholder (endpoint not supporting workspace)
    const plainFetchUrl = '/v2/control-planes/{controlPlaneId}/core-entities/routes/{id}'

    const configWithWorkspace = (workspace: string): KonnectBaseFormConfig => ({
      app: 'konnect',
      apiBaseUrl: wsBaseUrl,
      controlPlaneId: wsControlPlaneId,
      workspace,
      cancelRoute: { name: '/' },
    })

    const configNoWorkspace: KonnectBaseFormConfig = {
      app: 'konnect',
      apiBaseUrl: wsBaseUrl,
      controlPlaneId: wsControlPlaneId,
      cancelRoute: { name: '/' },
    }

    it('includes workspace name in fetch URL when workspace is provided', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/default/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      ).as('fetchWithWorkspace')

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('default'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
          canSubmit: true,
        },
      })

      cy.wait('@fetchWithWorkspace')
      cy.getTestId('form-fetch-error').should('not.exist')
    })

    it('uses non-default workspace name in fetch URL', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/test/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      ).as('fetchWithTestWorkspace')

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('test'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
          canSubmit: true,
        },
      })

      cy.wait('@fetchWithTestWorkspace')
      cy.getTestId('form-fetch-error').should('not.exist')
    })

    it('omits workspace segment in fetch URL when workspace is not provided', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      ).as('fetchNoWorkspace')

      cy.mount(EntityBaseForm, {
        props: {
          config: configNoWorkspace,
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
          canSubmit: true,
        },
      })

      cy.wait('@fetchNoWorkspace')
      cy.getTestId('form-fetch-error').should('not.exist')
    })

    it('renders edit form correctly when load succeeds with workspace config', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/default/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      )

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('default'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
          canSubmit: true,
        },
      })

      cy.getTestId('form-fetch-error').should('not.exist')
      cy.getTestId(`${wsEntityType}-edit-form-cancel`).should('be.enabled')
      cy.getTestId(`${wsEntityType}-edit-form-submit`).should('be.enabled')
    })

    it('shows fetch error when load fails with workspace config', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/default/routes/${wsEditId}`,
        },
        { statusCode: 500, body: {} },
      )

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('default'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
        },
      })

      cy.getTestId('form-fetch-error').should('be.visible')
    })

    it('ignores workspace config when fetchUrl has no {workspace} placeholder', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      ).as('fetchPlain')

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('default'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: plainFetchUrl,
          canSubmit: true,
        },
      })

      cy.wait('@fetchPlain')
      cy.getTestId('form-fetch-error').should('not.exist')
    })

    it('handles workspace name with hyphens and numbers', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${wsBaseUrl}/v2/control-planes/${wsControlPlaneId}/core-entities/my-workspace-123/routes/${wsEditId}`,
        },
        { statusCode: 200, body: {} },
      ).as('fetchWithComplexWorkspace')

      cy.mount(EntityBaseForm, {
        props: {
          config: configWithWorkspace('my-workspace-123'),
          formFields: route,
          entityType: wsEntityType,
          editId: wsEditId,
          fetchUrl: workspaceFetchUrl,
          canSubmit: true,
        },
      })

      cy.wait('@fetchWithComplexWorkspace')
      cy.getTestId('form-fetch-error').should('not.exist')
    })
  })
})
