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

    <component
      :is="CardTag"
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="ff-kv-field-entry"
      :class="{ 'ff-kv-field-entry--multiline': props.appearance?.string?.multiline }"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <div class="ff-kv-field-entry-fields">
        <EnhancedInput
          class="ff-kv-field-entry-key"
          :data-key-input="index"
          :data-testid="`ff-key-${field.path.value}.${index}`"
          :model-value="entry.key"
          :placeholder="keyPlaceholder || 'Key'"
          @keydown.enter.prevent="focus(index, 'value')"
          @update:model-value="value => updateKey(entry.id, value)"
        />

        <EnhancedInput
          class="ff-kv-field-entry-value"
          :data-testid="`ff-value-${field.path.value}.${index}`"
          :data-value-input="index"
          :model-value="(entry.value as string)"
          :multiline="props.appearance?.string?.multiline"
          :placeholder="valuePlaceholder || 'Value'"
          @keydown.enter="handleValueKeydown($event, index)"
          @update:model-value="value => updateValue(entry.id, value)"
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
      </div>

      <KTooltip
        class="ff-kv-field-entry-remove"
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
    </component>

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
import { KCard } from '@kong/kongponents'
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'
import type { MapFieldSchema } from '../../../types/plugins/form-schema'
import useI18n from '../../../composables/useI18n'
import type { KeyValueFieldEmits, KeyValueFieldProps } from '../shared/headless/useKeyValueField'
import { useKeyValueField } from '../shared/headless/useKeyValueField'
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
  updateKey,
  updateValue,
} = useKeyValueField(props, emit)

const fieldName = computed(() => {
  if (!field.path) return ''
  const name = getName(field.path.value)
  return replaceByDictionaryInFieldName(name)
})

const CardTag = computed(() => props.appearance?.string?.multiline ? KCard : 'div')

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

function handleValueKeydown(event: KeyboardEvent, index: number) {
  if (props.appearance?.string?.multiline) return
  event.preventDefault()
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

    &-fields {
      display: flex;
      flex: 1 1 0;
      gap: $kui-space-40;
    }

    &-key,
    &-value {
      flex: 1 1 0;
    }

    &--multiline {
      .ff-kv-field-entry-fields {
        flex-direction: column;
      }
    }
  }

  & &-entry--multiline :deep(.card-content) {
    align-items: flex-start;
    flex-direction: row;
    gap: $kui-space-40;
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }

  &-add-entry-btn {
    align-self: flex-start;
  }
}
</style>
