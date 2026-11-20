import { defineComponent, h, type PropType } from 'vue'
import { CelField, StringField } from '@kong-ui-public/freeform'
import type { CelPlugin } from '@kong-ui-public/monaco-editor/languages/cel'
import { useGatewayCelKind } from '../cel-editor'

export default defineComponent({
  name: 'PluginCelField',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    /** This field's CEL features on top of the Gateway variables. Without them the field stays a string input. */
    plugins: { type: Array as PropType<readonly CelPlugin[]>, default: undefined },
    minGatewayVersion: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const kind = useGatewayCelKind(() => props.plugins, { minGatewayVersion: props.minGatewayVersion })

    return () => kind.value
      ? h(CelField, { ...attrs, name: props.name, kind: kind.value }, slots)
      : h(StringField, { ...attrs, name: props.name }, slots)
  },
})
