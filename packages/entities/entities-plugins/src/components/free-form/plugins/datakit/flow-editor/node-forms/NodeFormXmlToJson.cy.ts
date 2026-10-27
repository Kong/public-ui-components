import { defineComponent, h } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import NodeFormXmlToJson from './NodeFormXmlToJson.vue'
import { provideEditorStore } from '../store/store'
import { provideConfirmModal } from '../composables/useConflictConfirm'

import type { FormSchema } from '@kong-ui-public/freeform'
import type { DatakitPluginData } from '../../types'

type EditorStore = ReturnType<typeof provideEditorStore>

const XML_TO_JSON_FIELDS = [
  { name: { type: 'string', required: true } },
  { type: { type: 'string', required: true } },
  { input: { type: 'string' } },
  { output: { type: 'string' } },
  { recognize_type: { type: 'boolean', default: true } },
  { attributes_block_name: { type: 'string' } },
  { attributes_name_prefix: { type: 'string' } },
  { text_block_name: { type: 'string', default: '#text' } },
  { text_as_property: { type: 'boolean', default: false } },
  { xpath: { type: 'string' } },
]

const FORCE_ARRAY_PATHS_FIELD = {
  force_array_paths: { type: 'array', elements: { type: 'string' }, default: [] },
}

/** The plugin schema served by the gateway, with or without `force_array_paths`. */
function pluginSchema(supportsForceArrayPaths: boolean): FormSchema {
  return {
    type: 'record',
    fields: [{
      config: {
        type: 'record',
        fields: [{
          nodes: {
            type: 'array',
            elements: {
              type: 'record',
              fields: [],
              subschema_definitions: {
                xml_to_json: {
                  type: 'record',
                  fields: supportsForceArrayPaths ? [...XML_TO_JSON_FIELDS, FORCE_ARRAY_PATHS_FIELD] : XML_TO_JSON_FIELDS,
                },
              },
            },
          },
        }],
      },
    }],
  } as unknown as FormSchema
}

function mountNodeForm({ supportsForceArrayPaths = true, forceArrayPaths }: { supportsForceArrayPaths?: boolean, forceArrayPaths?: string[] } = {}) {
  const pluginData = {
    config: {
      nodes: [{
        name: 'XML',
        type: 'xml_to_json',
        attributes_name_prefix: '@',
        ...(forceArrayPaths && { force_array_paths: forceArrayPaths }),
      }],
    },
  } as DatakitPluginData

  let store!: EditorStore

  const Harness = defineComponent({
    setup() {
      store = provideEditorStore(pluginData)
      provideConfirmModal(async () => true)
      const nodeId = store.getNodeByName('XML' as never)!.id

      return () => h(Form, { schema: pluginSchema(supportsForceArrayPaths), data: pluginData }, () => h(NodeFormXmlToJson, { nodeId }))
    },
  })

  return cy.mount(Harness, {
    global: { provide: { [FORMS_CONFIG]: { app: 'konnect' } } },
  }).then(() => store)
}

const forceArrayPathsField = () => cy.get('[data-testid="ff-array-force_array_paths"]')
const forceArrayPathInput = (index: number) => cy.get(`[data-testid="ff-force_array_paths.${index}"]`)
const addForceArrayPath = () => cy.get('[data-testid="ff-add-item-btn-force_array_paths"]').first().click()

describe('<NodeFormXmlToJson /> force_array_paths', () => {
  it('saves added paths to the node config', () => {
    mountNodeForm().then((store) => {
      addForceArrayPath()
      forceArrayPathInput(0).type('store/product')
      addForceArrayPath()
      forceArrayPathInput(1).type('soap:Envelope/soap:Body')

      cy.wrap(store).should(() => {
        expect(store.toConfigNodes()[0]).to.have.deep.property('force_array_paths', ['store/product', 'soap:Envelope/soap:Body'])
      })
    })
  })

  it('shows existing paths and saves removals', () => {
    mountNodeForm({ forceArrayPaths: ['store/product', 'store/tags'] }).then((store) => {
      forceArrayPathInput(0).should('have.value', 'store/product')
      forceArrayPathInput(1).should('have.value', 'store/tags')

      cy.get('[data-testid="ff-array-remove-item-btn-force_array_paths.0"]').click()

      cy.wrap(store).should(() => {
        expect(store.toConfigNodes()[0]).to.have.deep.property('force_array_paths', ['store/tags'])
      })
    })
  })

  it('flags paths the gateway would reject', () => {
    mountNodeForm().then((store) => {
      addForceArrayPath()
      forceArrayPathInput(0).type('/store/product').blur()

      forceArrayPathInput(0).parents('.k-input').should('have.class', 'input-error')
        .find('.help-text').should('contain.text', 'store/product')
      cy.wrap(store).should(() => {
        expect(store.invalidConfigNodeIds.value.size).to.equal(1)
      })

      forceArrayPathInput(0).clear().type('store/product').blur()

      forceArrayPathInput(0).parents('.k-input').should('not.have.class', 'input-error')
      cy.wrap(store).should(() => {
        expect(store.invalidConfigNodeIds.value.size).to.equal(0)
      })
    })
  })

  it('is hidden when the gateway does not support it', () => {
    mountNodeForm({ supportsForceArrayPaths: false })

    cy.get('[data-testid="ff-xpath"]').should('exist')
    forceArrayPathsField().should('not.exist')
    cy.get('.ff-field-error, [role="alert"]').should('not.exist')
  })
})
