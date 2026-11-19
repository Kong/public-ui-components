import { defineComponent, h } from 'vue'
import { kongExpressibleField, kongPluginState } from '@kong-ui-public/monaco-editor/languages/cel'
import PluginCelField from './PluginCelField'

// An expressible field falls back to its config value, so the Gateway rejects `default()` there.
const EXPRESSIBLE_FIELD_CEL = [kongPluginState(), kongExpressibleField()]

/** The input of an expanded expression twin (`expressions.*`): the Gateway dialect of expressible fields. */
export default defineComponent({
  name: 'ExpressionCelField',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
  },
  setup(props, { attrs, slots }) {
    return () => h(PluginCelField, { ...attrs, name: props.name, plugins: EXPRESSIBLE_FIELD_CEL }, slots)
  },
})
