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
      class="ff-object-field ff-object-field-as-child"
      v-bind="$attrs"
      :data-testid="`ff-object-${field.path.value}`"
    >
      <slot>
        <Field
          v-for="cfield in childFields"
          :key="Object.keys(cfield)[0]"
          :name="Object.keys(cfield)[0]"
        />
      </slot>
    </div>
  </template>

  <!-- Collapse wrapper -->
  <div
    v-else
    class="ff-object-field"
    :class="{
      'ff-object-field-collapsed': !expanded,
      'ff-object-field-sub-level': !isTopLevelField,
    }"
    :data-testid="`ff-object-${field.path.value}`"
    v-bind="$attrs"
  >
    <!-- Collapse header -->
    <header
      class="ff-object-field-header"
      :data-testid="`ff-object-header-${field.path.value}`"
    >
      <!-- Collapse toggle -->
      <button
        :aria-controls="contentId"
        :aria-expanded="expanded"
        :aria-label="fieldAttrs.label"
        class="ff-object-field-toggle-btn"
        data-testid="ff-object-field-toggle-btn"
        type="button"
        @click.prevent.stop="toggleDisplay()"
      >
        <ChevronRightIcon
          class="ff-object-field-toggle-btn-trigger-icon"
          :class="{ 'collapse-expanded': expanded }"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          data-testid="collapse-trigger-icon"
          decorative
          :size="KUI_ICON_SIZE_40"
        />

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
      </button>

      <!-- switch -->
      <KTooltip
        v-if="!fieldAttrs.required"
        :text="`Toggle ${fieldAttrs.label}`"
      >
        <div
          class="ff-object-field-switch-wrapper"
          @click.stop
        >
          <KInputSwitch
            v-model="added"
            :disabled="field.isInheritedDisabled.value"
            @update:model-value="handleAddOrRemove"
          />
        </div>
      </KTooltip>
    </header>

    <!-- Collapse content -->
    <SlideTransition>
      <div
        v-show="expanded"
        :id="contentId"
        class="ff-object-field-content"
        :data-testid="`ff-object-content-${field.path.value}`"
      >
        <slot>
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
import type { LabelAttributes } from '@kong/kongponents'
import { computed, onBeforeMount, toRef, useId } from 'vue'
import SlideTransition from './SlideTransition.vue'
import { useField, useFieldAttrs, useFormShared, FIELD_RENDERERS } from './composables'
import Field from './Field.vue'
import { ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'

import type { RecordFieldSchema } from 'src/types/plugins/form-schema'
import type { ResetLabelPathRule } from './types'

defineOptions({
  inheritAttrs: false,
})

const contentId = useId()

const {
  omit,
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
  appearance?: 'card' | 'default'
  omit?: string[]
  asChild?: boolean
  resetLabelPath?: ResetLabelPathRule
  fieldsOrder?: string[]
}>()

const { value: fieldValue, ...field } = useField(toRef(props, 'name'))
const { getSchema, getDefault } = useFormShared()

const added = defineModel<boolean>('added', { default: undefined })

const expanded = defineModel<boolean>('expanded', { default: undefined })
const isTopLevelField = computed(() => {
  return field.ancestors?.value.parent === null
    // special case for plugin config, todo: considered refactor to be configurable
    || field.ancestors?.value.parent.path === 'config'
})

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
  return 'reset'
})

const fieldAttrs = useFieldAttrs(field.path!, toRef(() => ({ required, ...props, resetLabelPath: realResetLabelPath.value })))
// const realAdded = computed(() => !fieldAttrs.value.required ? added.value ?? defaultAdded : true)

const asChild = computed(() => {
  if (defaultAsChild !== undefined) return defaultAsChild
  return isChildOfArray.value
})

const childFields = computed(() => {
  let fields = (field.schema!.value as RecordFieldSchema).fields
  if (omit) {
    fields = fields.filter(f => !omit.includes(Object.keys(f)[0]))
  }

  if (!fieldsOrder) return fields

  return fields.sort((a, b) => {
    const aKey = Object.keys(a)[0]
    const bKey = Object.keys(b)[0]

    const aIndex = fieldsOrder.indexOf(aKey)
    const bIndex = fieldsOrder.indexOf(bKey)

    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
})

function handleAddOrRemove() {
  if (field.error) return

  if (added.value) {
    if (fieldValue?.value == null) {
      fieldValue!.value = getDefault(field.path!.value)
    }
    field.enable()
  } else {
    field.disable()
  }
}

function toggleDisplay() {
  expanded.value = !expanded.value
}

onBeforeMount(() => {
  if (field.error || !fieldValue) return
  const hasValue = fieldValue.value != null

  added.value = hasValue && !field.isDisabled.value

  // If required or has value, expand by default
  if (fieldAttrs.value.required || hasValue) {
    expanded.value = true
  }
})
</script>

<style lang="scss" scoped>
.ff-object-field {
  align-self: stretch;
  display: flex;
  flex-direction: column;

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

  :deep(.k-tooltip p) {
    margin: 0;
  }

  &-switch-wrapper {
    align-items: center;
    display: flex;
  }

  &-toggle-btn {
    align-items: center;
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: inherit;
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    cursor: pointer;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    outline: none;
    padding: var(--kui-space-10, $kui-space-10);

    &:hover:not(:focus):not(:active) {
      color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    &:active {
      color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
    }

    &-trigger-icon {
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

      &.collapse-expanded {
        transform: rotate(90deg);
      }
    }

    label {
      cursor: unset;
    }
  }

  &-header {
    align-items: center;
    align-self: stretch;
    background: $kui-color-background-neutral-weakest;
    border: 1px solid $kui-color-border;
    border-radius: $kui-border-radius-20 $kui-border-radius-20 $kui-border-radius-0 $kui-border-radius-0;
    display: flex;
    justify-content: space-between;
    padding: $kui-space-50 $kui-space-60;
    transition: background-color $kui-animation-duration-20 ease-in-out;
  }

  &-content {
    align-self: stretch;
    background: $kui-color-background;
    border: 1px solid $kui-color-border;
    border-radius: 0 0 $kui-border-radius-20 $kui-border-radius-20;
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: $kui-space-80;
    padding: $kui-space-50 $kui-space-60;
  }

  &-sub-level {
    .ff-object-field-header {
      background-color: transparent;
      border: none;
      padding: 0 0 0 $kui-space-60;
    }

    .ff-object-field-content {
      border: none;
      margin-right: -$kui-space-60;
      padding-bottom: 0;
      padding-left: 44px;
      padding-top: $kui-space-70;
      position: relative;

      &::before {
        border-left: 1px solid $kui-color-border;
        content: '';
        display: block;
        height: 100%;
        left: 28px;
        position: absolute;
        top: 0;
        transform: translateX(-50%);
      }
    }
  }

  &-collapsed {
    .ff-object-field-header {
      background-color: $kui-color-background;
    }
  }
}
</style>
