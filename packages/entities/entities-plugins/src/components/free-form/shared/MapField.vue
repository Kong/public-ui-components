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
    class="ff-map-field"
    :data-testid="`ff-map-${field.path.value}`"
  >
    <header
      v-if="!!fieldAttrs.label"
      class="ff-map-field-header"
      :data-testid="`ff-map-header-${field.path.value}`"
    >
      <KLabel
        class="ff-map-field-label"
        v-bind="fieldAttrs.labelAttributes"
        :data-testid="`ff-label-${field.path.value}`"
        :required="fieldAttrs.required"
        :tooltip-attributes="fieldAttrs.labelAttributes.tooltipAttributes"
      >
        {{ fieldAttrs.label }}
        <template
          v-if="fieldAttrs.labelAttributes?.info"
          #tooltip
        >
          <slot name="tooltip">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="fieldAttrs.labelAttributes.info" />
          </slot>
        </template>
      </KLabel>
    </header>

    <component
      :is="itemTag"
      v-for="([keyId, name], index) in keys"
      :key="keyId"
      class="ff-map-field-item"
      :class="{
        'ff-map-field-item-simple': isSimpleMap,
        'ff-map-field-item-complex': !isSimpleMap,
      }"
      :data-testid="`ff-map-container-${field.path.value}.${index}`"
    >
      <div class="ff-map-field-fields">
        <EnhancedInput
          class="ff-map-field-fields-key"
          :data-key-input="index"
          :data-testid="`ff-map-key-${field.path.value}.${index}`"
          :model-value="name"
          :placeholder="keyPlaceholder || 'Key'"
          @keydown.enter.prevent="focus(index)"
          @update:model-value="(value: string) => updateKey(keyId, value)"
        />

        <StringField
          v-if="isStringValue"
          inline-vault-picker
          :multiline="appearance?.string?.multiline"
          :name="keyId"
          @keydown.enter="handleValueKeydown($event, index)"
        />

        <Field
          v-else
          :name="keyId"
        />
      </div>

      <KTooltip
        class="ff-kv-field-entry-remove"
        :text="i18n.t('actions.remove_entity', { entity: fieldDisplayName })"
      >
        <KButton
          appearance="tertiary"
          :aria-label="i18n.t('actions.remove_entity', { entity: fieldDisplayName })"
          :data-testid="`ff-map-remove-btn-${field.path.value}.${index}`"
          icon
          @click="removeKey(keyId)"
        >
          <CloseIcon />
        </KButton>
      </KTooltip>
    </component>

    <KButton
      appearance="tertiary"
      :aria-label="i18n.t('actions.add_entity', { entity: fieldDisplayName })"
      class="ff-map-field-add-entry-btn"
      :data-testid="`ff-map-add-btn-${field.path.value}`"
      @click="handleAddClick"
    >
      <AddIcon />
      {{ i18n.t('actions.add_entity', { entity: fieldDisplayName }) }}
    </KButton>
  </div>
</template>

<script lang="ts" setup>
import { toRef, computed, useTemplateRef, nextTick } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import { useFieldAttrs } from './composables'
import type { BaseFieldProps } from './types'
import { useMapField } from './composables/useMapField'
import Field from './Field.vue'
import { KCard } from '@kong/kongponents'
import EnhancedInput from './EnhancedInput.vue'
import useI18n from '../../../composables/useI18n'
import StringField from './StringField.vue'

interface MapFieldProps extends BaseFieldProps {
  keyPlaceholder?: string
  appearance?: {
    string?: {
      multiline?: boolean
    }
  }
}

const { i18n } = useI18n()

const props = defineProps<MapFieldProps>()
const emit = defineEmits<{
  /**
   * @deprecated Forward compatibility, only triggered when the type of value is string
   */
  legacyValueChange: [data: Record<string, unknown> | null]
}>()

const {
  keys,
  updateKey,
  addKey,
  removeKey,
  field,
  fieldDisplayName,
} = useMapField(toRef(props, 'name'), onLegacyValueChange)

const fieldAttrs = useFieldAttrs(field.path!, props)

const simpleValueTypes = ['string', 'number', 'boolean', 'integer', 'foreign']

const isSimpleMap = computed(() => {
  return field.schema?.value?.type === 'map'
    && simpleValueTypes.includes(field.schema.value.values.type)
    && !props.appearance?.string?.multiline
})

const valueSchema = computed(() => {
  return field.schema?.value?.type === 'map' ? field.schema.value.values : undefined
})

const isStringValue = computed(() => valueSchema.value?.type === 'string' && !valueSchema.value?.one_of)

const itemTag = computed(() => isSimpleMap.value ? 'div' : KCard)

const root = useTemplateRef('root')

function handleValueKeydown(event: KeyboardEvent, index: number) {
  if (props.appearance?.string?.multiline) return
  event.preventDefault()
  if (index === keys.value.length - 1) {
    addKey()
  }
  focus(index + 1)
}

async function focus(index: number) {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-key-input="${index}"]`)?.focus()
}

function handleAddClick() {
  addKey()

  const index = keys.value.findIndex(([_, name]) => !name)
  focus(index === -1 ? keys.value.length - 1 : index)
}

function onLegacyValueChange(newValue: Record<string, unknown> | null) {
  emit('legacyValueChange', newValue)
}

</script>

<style scoped lang="scss">
.ff-map-field {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  // .k-label is required to override styles correctly in KM
  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-header {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    height: 32px;
  }

  &-item-simple {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);

    .ff-map-field-fields {
      display: grid;
      flex: 1 1 0;
      gap: var(--kui-space-40, $kui-space-40);
      grid-template-columns: 1fr 1fr;
    }
  }

  &-item-complex {

    :deep(> .card-content) {
      align-items: flex-start;
      flex-direction: row;
      gap: var(--kui-space-40, $kui-space-40);

      > .ff-map-field-fields {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: var(--kui-space-40, $kui-space-40);
      }
    }
  }

  &-add-entry-btn {
    align-self: flex-start;
  }
}
</style>
