import { h, ref } from 'vue'
import * as monaco from 'monaco-editor'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import { getPluginConfig } from '../../plugin-registry'
import { usePreferences } from './composables'
import { goldenFixtures } from './test-utils/fixtures'

import type { DatakitPluginData, EditorMode } from './types'

const DatakitForm = getPluginConfig('datakit')!.component

const schema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      fields: [
        { nodes: { type: 'array', elements: { type: 'record', fields: [] } } },
        { debug: { type: 'boolean' } },
        { ca_certificates: { type: 'array', elements: { type: 'string' } } },
        { resources: { type: 'record', fields: [] } },
      ],
    },
  }],
}

const CODE_ONLY_CONFIG = goldenFixtures.find(({ id }) => id === 'authenticate-third-party-with-dynamic-url')!.pluginData.config

interface MountOptions {
  app?: 'konnect' | 'kongManager'
  editorMode?: EditorMode
  model?: DatakitPluginData
  isEditing?: boolean
}

function mountForm({ app = 'konnect', editorMode = 'code', model = { config: {} } as DatakitPluginData, isEditing = false }: MountOptions = {}) {
  usePreferences().editorMode.value = editorMode

  cy.intercept('GET', '**/ca_certificates*', { statusCode: 200, body: { data: [], next: null } })

  const Host = () => h('main', [
    h('div', { id: 'plugin-form-page-actions' }),
    h(DatakitForm as any, {
      schema,
      model,
      pluginName: 'datakit',
      isEditing,
      onFormChange: cy.spy().as('onFormChange'),
      onValidityChange: cy.spy().as('onValidityChange'),
    }),
  ])

  cy.mount(Host, {
    global: {
      provide: {
        [FORMS_CONFIG]: app === 'konnect'
          ? { app: 'konnect', apiBaseUrl: '/us/kong-api', controlPlaneId: '123' }
          : { app: 'kongManager', apiBaseUrl: '/kong-manager' },
      },
    },
  })
}

/** Replace the code editor content, as if the user typed it. */
function setCode(code: string) {
  cy.get('.dk-code-editor .monaco-editor', { timeout: 20000 }).should('be.visible')
  cy.then(() => {
    monaco.editor.getEditors()[0].setValue(code)
  })
}

function lastValidity() {
  return cy.get('@onValidityChange').its('lastCall.args.0')
}

function lastFormData() {
  return cy.get('@onFormChange').its('lastCall.args.0')
}

const flowOption = () => cy.get('[data-testid="datakit-editor-mode-switcher"] [data-testid="flow-option"]')

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

  describe('saving from the code editor (Konnect)', () => {
    it('accepts a flow-compatible config and keeps the flow editor available', () => {
      mountForm()
      setCode('config:\n  nodes:\n  - name: JQ\n    type: jq\n    jq: "."\n')

      lastValidity().should('deep.equal', { model: 'config', valid: true })
      lastFormData().its('config.nodes.0.name').should('eq', 'JQ')
      flowOption().should('not.have.attr', 'disabled')
    })

    it('does not block saving a config the flow editor cannot represent', () => {
      mountForm()
      setCode(`config: ${JSON.stringify(CODE_ONLY_CONFIG)}`)

      lastValidity().should('deep.equal', { model: 'config', valid: true })
      lastFormData().its('config.nodes.3.inputs.url').should('eq', 'BUILD_URL')
      flowOption().should('have.attr', 'disabled')
    })

    it('explains why the flow editor is unavailable', () => {
      mountForm()
      setCode(`config: ${JSON.stringify(CODE_ONLY_CONFIG)}`)

      flowOption().find('.dk-option-label').trigger('mouseenter', { force: true })
      cy.get('.popover-content')
        .should('contain.text', 'nodes[3].inputs')
        .and('contain.text', 'Unrecognized key: "url"')
    })

    it('blocks saving when the YAML cannot be parsed', () => {
      mountForm()
      setCode('config:\n  nodes: [\n')

      lastValidity().should('have.property', 'valid', false)
      lastValidity().its('error').should('be.a', 'string').and('not.be.empty')
      flowOption().should('have.attr', 'disabled')
    })

    it('makes the flow editor available again once the config is fixed', () => {
      mountForm()
      setCode(`config: ${JSON.stringify(CODE_ONLY_CONFIG)}`)
      flowOption().should('have.attr', 'disabled')

      setCode('config:\n  nodes:\n  - name: JQ\n    type: jq\n')
      flowOption().should('not.have.attr', 'disabled')
    })
  })

  describe('saving from the code editor (Kong Manager)', () => {
    it('always uses the code editor and never blocks schema-invalid configs', () => {
      mountForm({ app: 'kongManager', editorMode: 'flow' })

      cy.getTestId('datakit-editor-mode-switcher').should('not.exist')
      setCode(`config: ${JSON.stringify(CODE_ONLY_CONFIG)}`)

      lastValidity().should('deep.equal', { model: 'config', valid: true })
      lastFormData().its('config.nodes.3.inputs.url').should('eq', 'BUILD_URL')
    })
  })

  describe('opening a new plugin', () => {
    it('uses the flow editor', () => {
      mountForm({ editorMode: 'flow' })

      flowOption().should('not.have.attr', 'disabled')
      cy.get('.dk-flow-editor').should('exist')
    })
  })

  describe('opening an existing plugin', () => {
    it('uses the flow editor when the saved config can be represented', () => {
      mountForm({ editorMode: 'flow', isEditing: true, model: { config: { nodes: [{ name: 'JQ', type: 'jq', jq: '.' }] } as DatakitPluginData['config'] } })

      flowOption().should('not.have.attr', 'disabled')
      cy.get('.dk-flow-editor').should('exist')
    })

    it('falls back to the code editor when the saved config cannot be represented in the flow editor', () => {
      mountForm({ editorMode: 'flow', isEditing: true, model: { config: CODE_ONLY_CONFIG } })

      flowOption().should('have.attr', 'disabled')
      cy.get('.dk-code-editor').should('exist')
      cy.get('.dk-flow-editor').should('not.exist')
    })

    it('keeps fields the flow editor does not support in the form data', () => {
      mountForm({ editorMode: 'flow', isEditing: true, model: { config: CODE_ONLY_CONFIG } })

      lastFormData().its('config.nodes.3.inputs.url').should('eq', 'BUILD_URL')
    })
  })
})
