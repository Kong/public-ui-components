import { h, ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import { getPluginConfig } from '../../plugin-registry'
import { usePreferences } from './composables'

const DatakitForm = getPluginConfig('datakit')!.component

describe('<DatakitForm />', () => {
  it('teleports actions to a target mounted in the same tree and unmounts cleanly', () => {
    const showForm = ref(true)
    const Host = () => h('main', [
      h('div', { id: 'plugin-form-page-actions' }),
      showForm.value
        ? h(DatakitForm as any, {
          schema: { type: 'record', fields: [] },
          model: { config: {} },
          pluginName: 'datakit',
          isEditing: false,
          onFormChange: () => {},
        })
        : h('div', { 'data-testid': 'done-page' }),
    ])

    cy.mount(Host, {
      global: {
        provide: {
          [FORMS_CONFIG]: { app: 'konnect' },
        },
        stubs: {
          DynamicLayout: true,
          KSegmentedControl: true,
        },
      },
    })

    cy.get('#plugin-form-page-actions')
      .find('[data-testid="datakit-editor-mode-switcher"]')
      .should('exist')

    cy.then(() => {
      showForm.value = false
    })

    cy.getTestId('done-page').should('exist')
    cy.getTestId('datakit-editor-mode-switcher').should('not.exist')
  })

  describe('advanced configuration', () => {
    const pluginSchema = (supportsCaCertificates: boolean) => ({
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          fields: [
            { nodes: { type: 'array', elements: { type: 'record', fields: [] } } },
            { debug: { type: 'boolean' } },
            ...(supportsCaCertificates ? [{ ca_certificates: { type: 'array', elements: { type: 'string' } } }] : []),
          ],
        },
      }],
    })

    const mountForm = (supportsCaCertificates: boolean) => {
      usePreferences().editorMode.value = 'flow'
      cy.intercept('GET', '**/ca_certificates*', { statusCode: 200, body: { data: [], next: null } })

      cy.mount(() => h(DatakitForm as any, {
        schema: pluginSchema(supportsCaCertificates),
        model: { config: {} },
        pluginName: 'datakit',
        isEditing: false,
        onFormChange: () => {},
      }), {
        global: {
          provide: {
            [FORMS_CONFIG]: { app: 'konnect', apiBaseUrl: '/us/kong-api', controlPlaneId: '123' },
          },
        },
      })
    }

    it('shows CA certificates when the gateway supports them', () => {
      mountForm(true)

      cy.getTestId('form-section-advanced').should('exist')
      cy.getTestId('dk-advanced-configuration-collapse').should('exist')
    })

    it('is hidden when the gateway does not support CA certificates', () => {
      mountForm(false)

      cy.getTestId('form-section-plugin-config').should('exist')
      cy.getTestId('form-section-advanced').should('not.exist')
      cy.get('.k-alert.danger').should('not.exist')
    })
  })
})
