import { computed, defineComponent, h, type PropType } from 'vue'
import { CelField, StringField } from '@kong-ui-public/freeform'
import { useCelInput, type CelExpressionKind } from '../cel-editor'

export default defineComponent({
  name: 'PluginCelField',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    kind: { type: String as PropType<CelExpressionKind | null>, default: 'expression' },
  },
  setup(props, { attrs, slots }) {
    const { getLanguages } = useCelInput()
    const language = computed(() => props.kind && getLanguages(props.kind)[0])

    return () => language.value
      ? h(CelField, { ...attrs, name: props.name, language: language.value }, slots)
      : h(StringField, { ...attrs, name: props.name }, slots)
  },
})
