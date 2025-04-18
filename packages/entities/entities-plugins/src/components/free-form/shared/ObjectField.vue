<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <!-- only render children, no wrapper -->
  <template v-else-if="isChildOfArray">
    <div class="ff-object-field ff-object-field-as-child">
      <!-- manually rendering -->
      <slot v-if="$slots.default" />

      <!-- auto rendering -->
      <Field
        v-for="field in childFields"
        v-else
        :key="Object.keys(field)[0]"
        :name="Object.keys(field)[0]"
      />
    </div>
  </template>

  <!-- render children with wrapper -->
  <div
    v-else
    class="ff-object-field"
    :class="{ 'ff-object-field-collapsed': !realExpanded }"
  >
    <header class="ff-object-field-header">
      <KLabel
        class="ff-object-field-label"
        v-bind="{
          ...fieldAttrs,
          required: false
        }"
      >
        {{ fieldAttrs.label }}
        <template
          v-if="fieldAttrs.labelAttributes?.info"
          #tooltip
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="fieldAttrs.labelAttributes.info" />
        </template>
      </KLabel>
      <div class="ff-object-field-actions">
        <KButton
          v-if="collapsible && realAdded"
          appearance="tertiary"
          :class="`ff-object-field-button-${realExpanded ? 'collapse' : 'expand'}`"
          icon
          @click="expanded = !realExpanded"
        >
          <ChevronDownIcon
            v-if="realAdded"
            class="ff-object-field-button-icon"
          />
        </KButton>
        <KButton
          v-if="!fieldAttrs.required"
          appearance="tertiary"
          :class="`ff-object-field-button-${realAdded ? 'remove' : 'add'}`"
          icon
          @click="added = !added"
        >
          <TrashIcon v-if="realAdded" />
          <AddIcon v-else />
        </KButton>
      </div>
    </header>
    <SlideTransition>
      <div
        v-if="realExpanded"
        class="ff-object-field-content"
      >
        <!-- manually rendering -->
        <slot v-if="$slots.default" />

        <!-- auto rendering -->
        <Field
          v-for="field in childFields"
          v-else
          :key="Object.keys(field)[0]"
          :name="Object.keys(field)[0]"
        />
      </div>
    </SlideTransition>
  </div>
</template>

<script setup lang="ts">
import { KButton, KLabel, type LabelAttributes } from '@kong/kongponents'
import { TrashIcon, AddIcon, ChevronDownIcon } from '@kong/icons'
import { computed, onBeforeMount, toRef, watch } from 'vue'
import SlideTransition from './SlideTransition.vue'
import { useField, useFieldAttrs, useFormShared } from './composables'
import Field from './Field.vue'

import type { RecordFieldSchema } from 'src/types/plugins/form-schema'

const { defaultExpanded = true, defaultAdded = true, collapsible = true, omit, required = undefined, ...props } = defineProps<{
  name: string
  label?: string
  labelAttributes?: LabelAttributes
  required?: boolean
  defaultExpanded?: boolean
  defaultAdded?: boolean
  collapsible?: boolean
  appearance?: 'card' | 'default'
  omit?: string[]
}>()

const field = useField(toRef(props, 'name'))
const fieldAttrs = useFieldAttrs(field.path!, { required, ...props })
const { getSchema } = useFormShared()

const added = defineModel<boolean>('added', { default: undefined })
const realAdded = computed(() => !fieldAttrs.value.required ? added.value ?? defaultAdded : true)

const expanded = defineModel<boolean>('expanded', { default: undefined })
const realExpanded = computed(() => realAdded.value && (collapsible ? expanded.value ?? defaultExpanded : false))

// Determines if the current field is a child element of an array field
const isChildOfArray = computed(() => {
  if (field.ancestors?.value) {
    const parent = field.ancestors.value.parent
    if (parent?.path) {
      return getSchema(parent.path)?.type === 'array'
    }
  }
  return false
})

const childFields = computed(() => {
  const fields = (field.schema!.value as RecordFieldSchema).fields
  if (omit) {
    return fields.filter(f => !omit.includes(Object.keys(f)[0]))
  } else {
    return fields
  }
})

watch(realAdded, (value) => {
  if (!collapsible) {
    return
  }
  expanded.value = value
})

onBeforeMount(() => {
  added.value = !!field.value?.value
})
</script>

<style lang="scss" scoped>
.ff-object-field {
  &-as-child {
    display: flex;
    flex-direction: column;
    gap: $kui-space-80;
  }

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

  &-actions {
    align-items: center;
    display: flex;
    gap: $kui-space-20;
  }

  &-button-expand,
  &-button-collapse {
    .ff-object-field-button-icon {
      transition: transform $kui-animation-duration-20 ease-in-out;
    }
  }

  &-button-expand {
    .ff-object-field-button-icon {
      transform: rotate(-90deg);
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: $kui-space-80;
    margin-top: $kui-space-20;
    padding: $kui-space-60 $kui-space-40 $kui-space-20 $kui-space-60;
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
