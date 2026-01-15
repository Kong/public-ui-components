<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    v-show="!field.hide.value"
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
        :placeholder="keyPlaceholder || 'Key'"
        @keydown.enter.prevent="focus(index, 'value')"
      />

      <EnhancedInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :data-value-input="index"
        :placeholder="valuePlaceholder || 'Value'"
        @keydown.enter.prevent="handleValueEnter(index)"
      >
        <template #after>
          <component
            :is="autofillSlot"
            v-if="autofillSlot && realShowVaultSecretPicker"
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

      <KTooltip
        class="ff-array-field-item-remove-tooltip"
        :text="i18n.t('actions.remove_entity', { entity: fieldName })"
      >
        <KButton
          appearance="tertiary"
          :aria-label="i18n.t('actions.remove_entity', { entity: fieldName })"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="removeEntry(entry.id)"
        >
          <CloseIcon />
        </KButton>
      </KTooltip>
    </div>

    <KButton
      appearance="tertiary"
      :aria-label="i18n.t('actions.add_entity', { entity: fieldName })"
      class="ff-kv-field-add-entry-btn"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      @click="handleAddClick"
    >
      <AddIcon />
      {{ i18n.t('actions.add_entity', { entity: fieldName }) }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, inject, computed } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import type { MapFieldSchema } from '../../../types/plugins/form-schema'
import useI18n from '../../../composables/useI18n'
import { useKeyValueField, type KeyValueFieldEmits, type KeyValueFieldProps } from '../shared/headless/useKeyValueField'
import EnhancedInput from './EnhancedInput.vue'
import { replaceByDictionaryInFieldName } from './composables'
import { getName } from './utils'

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

const fieldName = computed(() => {
  if (!field.path) return ''
  const name = getName(field.path.value)
  return replaceByDictionaryInFieldName(name)
})

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

  &-add-entry-btn {
    align-self: flex-start;
  }
}
</style>
