<template>
  <KMultiselect
    data-testid="field-multiselect"
    :items="schema.values"
    :label-attributes="{ info: schema.help }"
    :model-value="value"
    :placeholder="schema.placeholder"
    :required="schema.required || undefined"
    width="100%"
    @update:model-value="onUpdate"
  />
</template>

<script>
import abstractField from '../abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  methods: {
    onUpdate(value) {
      this.$emit('model-updated', value, this.schema.model)
    },
  },
}
</script>
