<template>
  <div class="selection-group">
    <div
      v-for="(option, i) in schema.values"
      :key="i"
      class="option-group"
    >
      <div class="form-group">
        <label
          class="k-label"
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

<style lang="scss" scoped>
.selection-group {
  margin-bottom: 8px;
  width: 100%;

  .form-group {
    margin-bottom: 0;
  }
}
</style>
