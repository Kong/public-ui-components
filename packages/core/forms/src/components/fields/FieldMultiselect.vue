<template>
  <KMultiselect
    :aria-labelledby="getLabelId(schema)"
    data-testid="field-multiselect"
    :items="items"
    :label-attributes="{ info: schema.help }"
    :model-value="value"
    :placeholder="schema.placeholder"
    :required="schema.required || undefined"
    width="100%"
    @update:model-value="onUpdate"
  />
</template>

<script>
import abstractField from './abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  computed: {
    items() {
      if (this.schema.values) {
        return this.schema.values
      }
      if (this.schema.elements?.one_of?.length) {
        return this.schema.elements.one_of.map(value => ({ label: value, value }))
      }
      return []
    },
  },

  methods: {
    onUpdate(value) {
      this.$emit('model-updated', value, this.schema.model)
    },
  },
}
</script>
