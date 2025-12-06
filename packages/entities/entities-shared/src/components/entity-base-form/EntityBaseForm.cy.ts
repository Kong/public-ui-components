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

  it('displays View Configuration and Slideout when FF is enabled', () => {
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
})
