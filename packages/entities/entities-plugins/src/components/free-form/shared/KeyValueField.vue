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
      :class="{ 'ff-kv-field-entry--vertical': isComplexValue }"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <!-- Vertical layout for complex value types (record, array, etc.) -->
      <template v-if="isComplexValue">
        <KCard class="ff-kv-field-entry-card">
          <template #actions>
            <KButton
              appearance="none"
              :aria-label="i18n.t('actions.remove_entity', { entity: fieldName })"
              :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
              icon
              @click="removeEntry(entry.id)"
            >
              <CloseIcon />
            </KButton>
          </template>
          <EnhancedInput
            v-model.trim="entry.key"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :placeholder="keyPlaceholder || 'Key'"
            @keydown.enter.prevent="handleKeyEnter(index)"
          />
          <div
            v-if="entry.key"
            class="ff-kv-field-entry-body"
          >
            <Field :name="entry.id" />
          </div>
          <div
            v-else
            class="ff-kv-field-entry-placeholder"
            :data-testid="`ff-kv-placeholder-${field.path.value}.${index}`"
          >
            {{ i18n.t('plugins.free-form.kv_field.enter_key_hint') }}
          </div>
        </KCard>
      </template>

      <!-- Side-by-side layout for simple value types -->
      <template v-else>
        <EnhancedInput
          v-model.trim="entry.key"
          class="ff-kv-field-entry-key"
          :data-key-input="index"
          :data-testid="`ff-key-${field.path.value}.${index}`"
          :placeholder="keyPlaceholder || 'Key'"
          @keydown.enter.prevent="handleKeyEnter(index)"
        />

        <!-- String values: keep EnhancedInput (backwards compatible) -->
        <EnhancedInput
          v-if="isStringValue"
          class="ff-kv-field-entry-value"
          :data-testid="`ff-value-${field.path.value}.${index}`"
          :data-value-input="index"
          :model-value="stringValue(getEntryValue(entry.id))"
          :placeholder="valuePlaceholder || 'Value'"
          @keydown.enter.prevent="handleValueEnter(index)"
          @update:model-value="val => setEntryValue(entry.id, val?.trim())"
        >
          <template #after>
            <component
              :is="autofillSlot"
              v-if="autofillSlot && realShowVaultSecretPicker"
              :schema="autofillSchema"
              :update="value => handleAutofill(index, value)"
              :value="stringValue(getEntryValue(entry.id))"
            />
            <KAlert
              v-if="realShowVaultSecretPicker && !autofillSlot"
              appearance="warning"
              :data-testid="`ff-vault-secret-picker-warning-${field.path.value}`"
              :message="i18n.t('plugins.free-form.vault_picker.component_error')"
            />
          </template>
        </EnhancedInput>

        <!-- Non-string simple values (number, boolean, enum): delegate to Field -->
        <div
          v-else-if="entry.key"
          class="ff-kv-field-entry-value"
          :data-value-input="index"
        >
          <Field :name="entry.id" />
        </div>
        <div
          v-else
          class="ff-kv-field-entry-value ff-kv-field-entry-placeholder"
          :data-testid="`ff-kv-placeholder-${field.path.value}.${index}`"
        >
          {{ i18n.t('plugins.free-form.kv_field.enter_key_hint') }}
        </div>

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
      </template>
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
import Field from './Field.vue'
import { replaceByDictionaryInFieldName } from './composables'
import { getName, isTagField } from './utils'

const COMPLEX_TYPES = new Set(['record', 'array', 'map', 'json'])

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
  getEntryValue,
  setEntryValue,
} = useKeyValueField(props, emit)

const mapSchema = computed(() => field.schema?.value as MapFieldSchema | undefined)
const valueSchemaType = computed(() => mapSchema.value?.values?.type)

const isEnumValue = computed(() => {
  const valuesSchema = mapSchema.value?.values
  return !!valuesSchema && 'one_of' in valuesSchema && Array.isArray(valuesSchema.one_of)
})

const isStringValue = computed(() => {
  if (isEnumValue.value) return false
  return !valueSchemaType.value || valueSchemaType.value === 'string'
})

const isComplexValue = computed(() => {
  const type = valueSchemaType.value
  if (!type) return false
  // Sets that render as EnumField (multiselect dropdown) are simple
  if (type === 'set' && !isTagField(mapSchema.value?.values)) return false
  return COMPLEX_TYPES.has(type) || type === 'set'
})

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

async function focusFieldValue(index: number) {
  if (!root.value) return
  await nextTick()
  const container = root.value.querySelectorAll('.ff-kv-field-entry')[index]
  container?.querySelector<HTMLElement>('input, select, textarea, [tabindex]')?.focus()
}

function handleAddClick() {
  addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)
}

function handleKeyEnter(index: number) {
  if (isStringValue.value) {
    focus(index, 'value')
  } else {
    focusFieldValue(index)
  }
}

function handleValueEnter(index: number) {
  if (index === entries.value.length - 1) {
    addEntry()
  }
  focus(index + 1)
}

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)

const realShowVaultSecretPicker = computed(() => {
  if (!isStringValue.value) return false
  return showVaultSecretPicker ?? !!(field.schema!.value as MapFieldSchema)?.values?.referenceable
})

const autofillSchema = computed(() => ({ referenceable: realShowVaultSecretPicker.value }))

function stringValue(val: unknown): string {
  return (val ?? '') as string
}

function handleAutofill(index: number, value: string) {
  setEntryValue(entries.value[index].id, value)
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

    &--vertical {
      align-items: stretch;
      flex-direction: column;
    }

    &-card {
      position: relative;
      width: 100%;

      :deep(.card-header) {
        position: absolute;
        right: 8px;
        top: 8px;
        z-index: 10;
      }

      :deep(.card-content) {
        display: flex;
        flex-direction: column;
        gap: $kui-space-40;
        z-index: 1;
      }
    }

    &-placeholder {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
      font-style: italic;
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
