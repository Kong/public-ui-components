<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    ref="root"
    class="ff-kv-field"
    :data-testid="`ff-kv-${field.path.value}`"
  >
    <header
      class="ff-kv-field-header"
      :data-testid="`ff-kv-header-${field.path.value}`"
    >
      <KLabel
        class="ff-kv-field-label"
        v-bind="labelAttrs"
        :data-testid="`ff-label-${field.path.value}`"
        :tooltip-attributes="labelAttrs.labelAttributes.tooltipAttributes"
      >
        {{ labelAttrs.label }}
        <template
          v-if="labelAttrs.labelAttributes?.info"
          #tooltip
        >
          <slot name="tooltip">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="labelAttrs.labelAttributes.info" />
          </slot>
        </template>
      </KLabel>
    </header>

    <div
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="ff-kv-field-entry"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <EnhancedInput
        v-model.trim="entry.key"
        class="ff-kv-field-entry-key"
        :data-key-input="index"
        :data-testid="`ff-key-${field.path.value}.${index}`"
        :disabled="field.isInheritedDisabled.value"
        :placeholder="keyPlaceholder || 'Key'"
        @keydown.enter.prevent="focus(index, 'value')"
      />

      <EnhancedInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :data-value-input="index"
        :disabled="field.isInheritedDisabled.value"
        :placeholder="valuePlaceholder || 'Value'"
        @keydown.enter.prevent="handleValueEnter(index)"
      >
        <template #after>
          <component
            :is="autofillSlot"
            v-if="autofillSlot && realShowVaultSecretPicker"
            :disabled="field.isInheritedDisabled.value"
            :schema="schema"
            :update="value => handleAutofill(index, value)"
            :value="entry.value"
          />
          <KAlert
            v-if="realShowVaultSecretPicker && !autofillSlot"
            appearance="warning"
            :data-testid="`ff-vault-secret-picker-warning-${field.path.value}`"
            :message="i18n.t('plugins.free-form.vault_picker.component_error')"
          />
        </template>
      </EnhancedInput>

      <KTooltip :text="`Remove ${labelAttrs.label}`">
        <KButton
          appearance="tertiary"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          :disabled="field.isInheritedDisabled.value"
          icon
          @click.stop="removeEntry(entry.id)"
        >
          <CloseIcon />
        </KButton>
      </KTooltip>
    </div>

    <KButton
      appearance="tertiary"
      class="ff-kv-add-btn"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      :disabled="field.isInheritedDisabled.value"
      @click="handleAddClick"
    >
      <AddIcon />
      Add {{ labelAttrs.label }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, inject, computed } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import type { MapFieldSchema } from '../../../types/plugins/form-schema'
import useI18n from '../../../composables/useI18n'
import { useKeyValueField, type KeyValueFieldEmits, type KeyValueFieldProps } from './headless/useKeyValueField'
import EnhancedInput from './EnhancedInput.vue'

const { showVaultSecretPicker = undefined, ...props } = defineProps<KeyValueFieldProps>()

const { i18n } = useI18n()

const emit = defineEmits<KeyValueFieldEmits>()

const {
  entries,
  addEntry,
  removeEntry,
  reset,
  setValue,
  labelAttrs,
  field,
} = useKeyValueField(props, emit)

const root = useTemplateRef('root')

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddClick() {
  addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)
}

function handleValueEnter(index: number) {
  if (index === entries.value.length - 1) {
    addEntry()
  }
  focus(index + 1)
}

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const realShowVaultSecretPicker = computed(() => {
  return showVaultSecretPicker ?? !!(field.schema!.value as MapFieldSchema)?.values?.referenceable
})
const schema = computed(() => ({ referenceable: realShowVaultSecretPicker.value }))

function handleAutofill(index: number, value: string) {
  entries.value[index].value = value
}

defineExpose({
  reset,
  setValue,
})
</script>

<style lang="scss" scoped>
.ff-kv-field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;

  // .k-label is required to override styles correctly in KM
  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-header {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
    height: 32px;
  }

  &-entry {
    align-items: center;
    display: flex;
    gap: $kui-space-40;

    &-key,
    &-value {
      flex: 1 1 0;
    }
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }

  .ff-kv-add-btn {
    align-self: flex-start;
  }
}
</style>
