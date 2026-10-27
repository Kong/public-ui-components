import { defineComponent, h } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import NodeFormProperty from './NodeFormProperty.vue'
import { provideEditorStore } from '../store/store'
import { provideConfirmModal } from '../composables/useConflictConfirm'

import type { FormSchema } from '@kong-ui-public/freeform'
import type { DatakitPluginData } from '../../types'

type EditorStore = ReturnType<typeof provideEditorStore>

const PROPERTY_FIELDS = [
  { name: { type: 'string', required: true } },
  { type: { type: 'string', required: true } },
  { input: { type: 'string' } },
  { output: { type: 'string' } },
  { property: { type: 'string', required: true } },
  { content_type: { type: 'string', one_of: ['application/json', 'text/plain', 'application/octet-stream'] } },
]

const NON_NIL_FIELD = {
  non_nil: { type: 'boolean', default: false },
}

/** The plugin schema served by the gateway, with or without `non_nil`. */
function pluginSchema(supportsNonNil: boolean): FormSchema {
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
                property: {
                  type: 'record',
                  fields: supportsNonNil ? [...PROPERTY_FIELDS, NON_NIL_FIELD] : PROPERTY_FIELDS,
                },
              },
            },
          },
        }],
      },
    }],
  } as unknown as FormSchema
}

function mountNodeForm({ supportsNonNil = true }: { supportsNonNil?: boolean } = {}) {
  const pluginData = {
    config: {
      nodes: [{ name: 'PROP', type: 'property', property: 'kong.client.ip' }],
    },
  } as DatakitPluginData

  let store!: EditorStore

  const Harness = defineComponent({
    setup() {
      store = provideEditorStore(pluginData)
      provideConfirmModal(async () => true)
      const nodeId = store.getNodeByName('PROP' as never)!.id

      return () => h(Form, { schema: pluginSchema(supportsNonNil), data: pluginData }, () => h(NodeFormProperty, { nodeId }))
    },
  })

  return cy.mount(Harness, {
    global: { provide: { [FORMS_CONFIG]: { app: 'konnect' } } },
  }).then(() => store)
}

describe('<NodeFormProperty /> non_nil', () => {
  it('saves the value to the node config', () => {
    mountNodeForm().then((store) => {
      cy.get('[data-testid="ff-non_nil"]').check({ force: true })

      cy.wrap(store).should(() => {
        expect(store.toConfigNodes()[0]).to.have.property('non_nil', true)
      })
    })
  })

  it('is hidden when the gateway does not support it', () => {
    mountNodeForm({ supportsNonNil: false })

    cy.get('[data-testid="ff-content_type"]').should('exist')
    cy.get('[data-testid="ff-non_nil"]').should('not.exist')
    cy.get('.k-alert.danger').should('not.exist')
  })
})
