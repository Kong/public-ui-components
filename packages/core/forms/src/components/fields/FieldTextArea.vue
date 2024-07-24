<template>
  <div class="field-textarea">
    <textarea
      :id="getFieldID(schema)"
      v-model="value"
      v-attributes="'input'"
      class="form-control"
      :class="schema.fieldClasses"
      :disabled="disabled || null"
      :maxlength="schema.max"
      :minlength="schema.min"
      :name="schema.inputName"
      :placeholder="schema.placeholder"
      :readonly="schema.readonly"
      :required="schema.required"
      :rows="schema.rows || 2"
    />

    <!-- autofill -->
    <component
      :is="autofillSlot"
      :schema="schema"
      :update="(val) => value = val"
      :value="value"
    />
  </div>
</template>

<script>
import { AUTOFILL_SLOT } from '../../const'
import abstractField from './abstractField'

export default {
  mixins: [abstractField],
  inject: {
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },
}
</script>

<style lang="scss" scoped>
.field-textarea {
  width: 100%;
}
</style>
