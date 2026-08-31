import { h, ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import { getPluginConfig } from '../../shared/plugin-registry'

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
})
