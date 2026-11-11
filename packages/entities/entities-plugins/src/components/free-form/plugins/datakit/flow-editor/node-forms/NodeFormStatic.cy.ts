import { defineComponent, h } from 'vue'
import { Form } from '@kong-ui-public/freeform'

import NodeFormStatic from './NodeFormStatic.vue'
import { useEditorStore } from '../store/store'
import { provideConfirmModal } from '../composables/useConflictConfirm'
import { mountWithStore } from '../../test-utils/mount'
import { DATAKIT_PLUGIN_SCHEMA } from '../../test-utils/schema'

import type { DatakitPluginData, NodeName } from '../../types'

function mountStaticForm(values: Record<string, unknown>) {
  const pluginData = {
    config: { nodes: [{ name: 'STATIC', type: 'static', values }] },
  } as DatakitPluginData

  const Wrapper = defineComponent({
    setup() {
      const { getNodeByName } = useEditorStore()
      provideConfirmModal(async () => true)
      const nodeId = getNodeByName('STATIC' as NodeName)!.id
      return () => h(Form, { schema: DATAKIT_PLUGIN_SCHEMA, data: pluginData }, () => h(NodeFormStatic, { nodeId }))
    },
  })

  return mountWithStore(Wrapper, { pluginData })
}

const valueInput = (index: number) => cy.get(`[data-testid="ff-value-values.${index}"]`)

describe('<NodeFormStatic />', () => {
  it('keeps the types of values that were not edited', () => {
    mountStaticForm({ CODE: '123', FLAG: 'true', NAME: 'x' }).then((store) => {
      valueInput(2).clear().type('y').blur()

      cy.wrap(store).should(() => {
        expect(store.toConfigNodes()[0]).to.have.deep.property('values', { CODE: '123', FLAG: 'true', NAME: 'y' })
      })
    })
  })

  it('parses the edited value from its text', () => {
    mountStaticForm({ COUNT: 'x' }).then((store) => {
      valueInput(0).clear().type('42').blur()

      cy.wrap(store).should(() => {
        expect(store.toConfigNodes()[0]).to.have.deep.property('values', { COUNT: 42 })
      })
    })
  })
})
