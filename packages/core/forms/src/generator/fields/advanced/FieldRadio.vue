<template>
  <div class="selection-group w-100 mb-2">
    <div
      v-for="(option, i) in schema.values"
      :key="i"
      class="option-group"
    >
      <div class="form-group mb-0">
        <label
          class="k-input-label"
          :class="option.name"
        >
          <input
            :id="schema.name+'-'+i"
            :checked="checkOption(option)"
            class="k-input"
            :name="schema.name"
            type="radio"
            :value="option.value"
            @change="onChange"
          >
          {{ option.name }}
        </label>
      </div>
    </div>
  </div>
</template>
<script>
import abstractField from '../abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  methods: {
    updateModel(options) {
      // Emit value of field to EntityForm
      this.$emit('model-updated', options, this.schema.model)
    },

    checkOption(option) {
      if (this.model[this.schema.model]) {
        return option.value.toString() === this.model[this.schema.model].toString()
      }

      return option.checked
    },

    onChange(e) {
      let updatedValue = e.target.value.split(',')
      if (!this.schema.array) {
        updatedValue = updatedValue.toString()
      }

      this.updateModel(updatedValue)
    },
  },
}
</script>
