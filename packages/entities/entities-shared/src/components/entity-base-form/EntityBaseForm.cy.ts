// Cypress component test spec file
import { h } from 'vue'
import type { KonnectBaseFormConfig } from '../../types'
import EntityBaseForm from './EntityBaseForm.vue'

describe('<EntityBaseForm />', () => {
  const controlPlaneId = '123abc-ilove-cats'
  const config: KonnectBaseFormConfig = {
    app: 'konnect',
    apiBaseUrl: '/us/kong-api/konnect-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
    // Set the root `.env.development.local` variable to a control plane your PAT can access
    controlPlaneId,
    cancelRoute: { name: '/' },
  }
  const editId = '1234-ideclare-athumb-war'
  const fetchUrl = `/api/runtime_groups/${config.controlPlaneId}/routes/{id}`

  it('disables save button when canSubmit is false', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        canSubmit: false,
      },
    })

    cy.getTestId('form-cancel').should('be.visible')
    cy.getTestId('form-submit').should('be.visible')

    cy.getTestId('form-cancel').should('be.enabled')
    cy.getTestId('form-submit').should('be.disabled')
  })

  it('disables save and cancel when isReadonly is true', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        canSubmit: true,
        isReadonly: true,
      },
    })

    cy.getTestId('form-cancel').should('be.visible')
    cy.getTestId('form-submit').should('be.visible')

    cy.getTestId('form-cancel').should('be.disabled')
    cy.getTestId('form-submit').should('be.disabled')
  })

  it('displays View Configuration and Slideout when FF is enabled', () => {
    cy.mount(EntityBaseForm, {
      props: {
        config,
        canSubmit: true,
      },
    })

    cy.getTestId('form-view-configuration').should('be.visible')
    cy.getTestId('form-view-configuration').click()

    cy.getTestId('form-view-configuration-slideout').should('exist')
    cy.getTestId('form-view-configuration-slideout-tabs').should('exist')
    cy.get('.yaml-config').should('exist')
  })

  it('displays error message when provided', () => {
    const error = 'Beware! Here there be errors'

    cy.mount(EntityBaseForm, {
      props: {
        config,
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
        url: `${config.apiBaseUrl}/api/runtime_groups/${config.controlPlaneId}/routes/${editId}`,
      },
      {
        statusCode: 200,
        body: {},
      },
    )

    cy.mount(EntityBaseForm, {
      props: {
        config,
        canSubmit: true,
        editId,
        fetchUrl,
      },
    })

    cy.getTestId('form-fetch-error').should('not.exist')
    cy.getTestId('form-cancel').should('be.visible')
    cy.getTestId('form-submit').should('be.visible')

    cy.getTestId('form-cancel').should('be.enabled')
    cy.getTestId('form-submit').should('be.enabled')
  })

  it('handles edit flow when load is unsuccessful', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${config.apiBaseUrl}/api/runtime_groups/${config.controlPlaneId}/routes/${editId}`,
      },
      {
        statusCode: 500,
        body: {},
      },
    )

    cy.mount(EntityBaseForm, {
      props: {
        config,
        canSubmit: true,
        editId,
        fetchUrl,
      },
    })

    cy.getTestId('form-fetch-error').should('be.visible')
    cy.getTestId('form-cancel').should('not.exist')
    cy.getTestId('form-submit').should('not.exist')
  })

  it('should show slot content', () => {
    const content = 'Look Mah! I iz form!'
    const action = 'Continue?'

    cy.mount(EntityBaseForm, {
      props: {
        config,
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
