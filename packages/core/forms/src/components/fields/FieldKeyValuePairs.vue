<template>
  <div class="key-value-pairs-editor">
    <div
      v-for="(pair, index) in pairs"
      :key="index"
      class="pair-item"
    >
      <div class="pair-item-cell">
        <input
          class="form-control"
          :data-testid="`${getFieldID(schema)}-pair-key-${index}`"
          :placeholder="schema.keyInputPlaceholder ?? 'Key'"
          type="text"
          :value="pair.key"
          @input="(e) => { onInput(e, index, 'key') }"
        >

        <!-- autofill -->
        <component
          :is="autofillSlot"
          :schema="schema"
          :update="(value) => onInput({ target: { value } }, index, 'key')"
          :value="pair.key"
        />
      </div>

      <div class="pair-item-cell">
        <input
          class="form-control"
          :data-testid="`${getFieldID(schema)}-pair-value-${index}`"
          :placeholder="schema.valueInputPlaceholder ?? 'Value'"
          type="text"
          :value="pair.value"
          @input="(e) => { onInput(e, index, 'value') }"
        >

        <!-- autofill -->
        <component
          :is="autofillSlot"
          :schema="schema"
          :update="(value) => onInput({ target: { value } }, index, 'value')"
          :value="pair.value"
        />
      </div>

      <KButton
        appearance="tertiary"
        :data-testid="`${getFieldID(schema)}-remove-pair-${index}`"
        @click="() => { removePair(index) }"
      >
        <TrashIcon />
      </KButton>
    </div>
    <KButton
      appearance="tertiary"
      :class="schema.newElementButtonLabelClasses"
      :data-testid="`${getFieldID(schema)}-add-pair`"
      type="button"
      @click="addPair"
    >
      {{ schema.newElementButtonLabel ?? '+ Add Pair' }}
    </KButton>
  </div>
</template>

<script>
import { TrashIcon } from '@kong/icons'
import { AUTOFILL_SLOT } from '../../const'
import abstractField from './abstractField'

export default {
  name: 'FieldKeyValuePairs',

  components: { TrashIcon },

  mixins: [abstractField],

  inject: {
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },

  data() {
    return {
      pairs: [],
    }
  },

  watch: {
    pairs: {
      handler() {
        this.updateValue()
      },
      deep: true,
    },
  },

  created() {
    if (!this.value) {
      this.value = {}
    }

    const modelPairs = this.model?.[this.schema?.model] ?? {}

    Object.keys(modelPairs).forEach((key) => {
      this.pairs.push({
        key,
        value: modelPairs[key],
      })
    })
  },

  methods: {
    onInput(e, index, type) {
      this.pairs[index][type] = e.target.value
    },

    updateValue() {
      this.value = this.pairs.reduce((acc, { key, value }) => ({
        ...acc,
        ...(key && value ? { [key]: value } : null),
      }), {})
    },

    addPair() {
      this.pairs.push({
        key: '',
        value: '',
      })
    },

    removePair(index) {
      this.pairs.splice(index, 1)
    },
  },
}
</script>

<style lang="scss" scoped>
.key-value-pairs-editor {
  width: 100%;

  .pair-item {
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
    justify-content: space-between;

    &:not(:first-child) {
      margin-top: var(--kui-space-50, $kui-space-50);
    }

    .pair-item-cell {
      flex-grow: 1;
    }
  }
}
</style>
