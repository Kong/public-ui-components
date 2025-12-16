<template>
  <component :is="$slots[FIELD_RENDERERS]" />

  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <!-- only render children, no wrapper -->
  <template v-else-if="asChild">
    <div
      v-show="!hide"
      class="ff-object-field ff-object-field-as-child"
      v-bind="$attrs"
      :data-testid="`ff-object-${field.path.value}`"
    >
      <slot>
        <EntityChecksAlert
          :entity-checks="field.schema.value?.entity_checks"
          :omitted-fields="omit"
        />
        <Field
          v-for="cfield in childFields"
          :key="Object.keys(cfield)[0]"
          :name="Object.keys(cfield)[0]"
        />
      </slot>
    </div>
  </template>

  <!-- render children with wrapper -->
  <div
    v-else
    v-show="!hide"
    class="ff-object-field"
    :class="{ 'ff-object-field-collapsed': !realExpanded }"
    :data-testid="`ff-object-${field.path.value}`"
    v-bind="$attrs"
  >
    <header
      class="ff-object-field-header"
      :data-testid="`ff-object-header-${field.path.value}`"
    >
      <KLabel
        class="ff-object-field-label"
        :data-testid="`ff-label-${field.path.value}`"
        v-bind="{
          ...fieldAttrs,
          required: false,
        }"
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
      <div class="ff-object-field-actions">
        <KButton
          v-if="collapsible && realAdded"
          appearance="tertiary"
          :class="`ff-object-field-button-${realExpanded ? 'collapse' : 'expand'}`"
          :data-testid="`ff-object-toggle-btn-${field.path.value}`"
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
          :data-testid="`ff-object-${realAdded ? 'remove' : 'add'}-btn-${field.path.value}`"
          icon
          @click="handleAddOrRemove"
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
        :data-testid="`ff-object-content-${field.path.value}`"
      >
        <slot>
          <EntityChecksAlert
            :entity-checks="field.schema.value?.entity_checks"
            :omitted-fields="omit"
          />
          <Field
            v-for="cfield in childFields"
            :key="Object.keys(cfield)[0]"
            :name="Object.keys(cfield)[0]"
          />
        </slot>
      </div>
    </SlideTransition>
  </div>
</template>

<script setup lang="ts">
import { KButton, KLabel, type LabelAttributes } from '@kong/kongponents'
import { TrashIcon, AddIcon, ChevronDownIcon } from '@kong/icons'
import { computed, onBeforeMount, toRef, watch } from 'vue'
import SlideTransition from './SlideTransition.vue'
import { useField, useFieldAttrs, useFormShared, FIELD_RENDERERS } from './composables'
import Field from './Field.vue'
import EntityChecksAlert from './EntityChecksAlert.vue'
import { sortFieldsByBundles, sortFieldsByFieldNames } from '../shared/utils'

import type { RecordFieldSchema } from 'src/types/plugins/form-schema'
import type { RenderRules, ResetLabelPathRule } from './types'

defineOptions({
  inheritAttrs: false,
})

const {
  defaultExpanded = true, defaultAdded = true, collapsible = true, omit,
  required = undefined, asChild: defaultAsChild = undefined, resetLabelPath,
  fieldsOrder,
  ...props
} = defineProps<{
  name: string
  label?: string
  labelAttributes?: LabelAttributes
  required?: boolean
  defaultExpanded?: boolean
  defaultAdded?: boolean
  collapsible?: boolean
  appearance?: 'card' | 'default'
  omit?: string[]
  asChild?: boolean
  resetLabelPath?: ResetLabelPathRule
  fieldsOrder?: string[]
  renderRules?: RenderRules
}>()

const { value: fieldValue, hide, ...field } = useField(toRef(props, 'name'))
const {
  getSchema,
  getDefault,
  useCurrentRenderRules,
} = useFormShared()

const currentRenderRules = useCurrentRenderRules({
  fieldPath: field.path!,
  rules: toRef(props, 'renderRules'),
  omittedFields: toRef(() => omit),
  parentValue: fieldValue!,
})

const added = defineModel<boolean>('added', { default: undefined })

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

const realResetLabelPath = computed(() => {
  if (resetLabelPath !== undefined) return resetLabelPath
  if (isChildOfArray.value) return 'reset'
  return 'inherit'
})

const fieldAttrs = useFieldAttrs(field.path!, toRef(() => ({ required, ...props, resetLabelPath: realResetLabelPath.value })))
const realAdded = computed(() => !fieldAttrs.value.required ? added.value ?? defaultAdded : true)

const asChild = computed(() => {
  if (defaultAsChild !== undefined) return defaultAsChild
  return isChildOfArray.value
})

const childFields = computed(() => {
  let fields = (field.schema!.value as RecordFieldSchema).fields

  if (omit) {
    fields = fields.filter(f => !omit.includes(Object.keys(f)[0]))
  }

  if (fieldsOrder) {
    return sortFieldsByFieldNames(fields, fieldsOrder)
  }

  if (currentRenderRules.value?.bundles) {
    fields = sortFieldsByBundles([...fields], currentRenderRules.value.bundles)
  }

  return fields
})

function handleAddOrRemove() {
  added.value = !added.value
  if (added.value) {
    fieldValue!.value = getDefault(field.path!.value)
  } else {
    fieldValue!.value = null
  }
}

watch(realAdded, (value) => {
  if (!collapsible) {
    return
  }
  expanded.value = value
})

onBeforeMount(() => {
  added.value = !!fieldValue?.value
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
