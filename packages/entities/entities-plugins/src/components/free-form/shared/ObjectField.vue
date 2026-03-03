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
    :class="{ 'ff-object-field-collapsed': !expanded }"
    :data-testid="`ff-object-${field.path.value}`"
    v-bind="$attrs"
  >
    <header
      class="ff-object-field-header"
      :data-testid="`ff-object-header-${field.path.value}`"
    >
      <div class="ff-object-field-header-toggle">
        <!-- Collapse toggle -->
        <button
          :aria-controls="contentId"
          :aria-expanded="expanded"
          :aria-label="fieldAttrs.label"
          class="ff-object-field-toggle-btn"
          :data-testid="`ff-object-toggle-btn-${field.path.value}`"
          :disabled="!added"
          type="button"
          @click.prevent.stop="toggleDisplay"
        >
          <ChevronRightIcon
            class="ff-object-field-toggle-btn-trigger-icon"
            :class="{ 'collapse-expanded': expanded }"
            :data-testid="`ff-object-toggle-trigger-icon-${field.path.value}`"
            decorative
            :size="KUI_ICON_SIZE_30"
          />
        </button>

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
      </div>

      <!-- Switch button -->
      <KInputSwitch
        v-if="!fieldAttrs.required"
        v-model="added"
        :data-testid="`ff-object-switch-${field.path.value}`"
        @update:model-value="handleToggleSwitch"
      />
    </header>

    <SlideTransition>
      <div
        v-if="expanded"
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

    <div
      v-if="expanded"
      class="indent-guide"
    />
  </div>
</template>

<script setup lang="ts">
import { KLabel, type LabelAttributes } from '@kong/kongponents'
import { ChevronRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { computed, onBeforeMount, toRef, useId, watch } from 'vue'
import SlideTransition from './SlideTransition.vue'
import { useField, useFieldAttrs, useFormShared, FIELD_RENDERERS } from './composables'
import Field from './Field.vue'
import EntityChecksAlert from './EntityChecksAlert.vue'
import { sortFieldsByBundles, sortFieldsByFieldNames } from '../shared/utils'

import type { RecordFieldSchema } from 'src/types/plugins/form-schema'
import type { RenderRules, ResetLabelPathRule } from './types'

const contentId = useId()

defineOptions({
  inheritAttrs: false,
})

const {
  defaultAdded = true, collapsible = true, omit,
  required = undefined, asChild: defaultAsChild = undefined, resetLabelPath = 'reset',
  fieldsOrder,
  ...props
} = defineProps<{
  name: string
  label?: string
  labelAttributes?: LabelAttributes
  required?: boolean
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

const fieldAttrs = useFieldAttrs(field.path!, { required, ...props, resetLabelPath })
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

function toggleDisplay() {
  expanded.value = !expanded.value
}

function handleToggleSwitch() {
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
  if (field.error || !fieldValue) return
  const hasValue = fieldValue.value != null

  added.value = hasValue

  // If required or has value, expand by default
  if (fieldAttrs.value.required || hasValue) {
    expanded.value = true
  }
})
</script>

<style lang="scss" scoped>
$indent-guide-width: 6px;
$indent-guide-left-offset: -10px;
$indent-guide-top-offset: 20px;

.ff-object-field {
  position: relative;

  .indent-guide {
    bottom: 0;
    left: $indent-guide-left-offset;
    position: absolute;
    top: $indent-guide-top-offset;
    transform: translateX(-50%);
    width: $indent-guide-width;

    &::before {
      border-left: 1px solid var(--kui-color-border-neutral-weaker, $kui-color-border-neutral-weaker);
      bottom: 0;
      content: '';
      left: 50%;
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      width: 0;
    }

    &:hover::before {
      border-left-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
    }
  }

  &-as-child {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-80, $kui-space-80);
  }

  // .k-label is required to override styles correctly in KM
  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-header {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);

    &-toggle {
      align-items: center;
      display: flex;
    }
  }

  &-actions {
    align-items: center;
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
  }

  &-button-expand,
  &-button-collapse {
    .ff-object-field-button-icon {
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
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
    gap: var(--kui-space-80, $kui-space-80);
    margin-top: var(--kui-space-20, $kui-space-20);
    padding: var(--kui-space-60, $kui-space-60) 0 var(--kui-space-20, $kui-space-20) var(--kui-space-70, $kui-space-70);
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }

  &-toggle-btn {
    align-items: center;
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border: none;
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
    cursor: pointer;
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-20, $kui-space-20);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-left: -var(--kui-space-70, $kui-space-70);
    outline: none;
    padding: var(--kui-space-10, $kui-space-10);

    &:hover:not(:focus, :active, :disabled) {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    }

    &:focus-visible {
      box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    }

    &-trigger-icon {
      transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;

      &.collapse-expanded {
        transform: rotate(90deg);
      }
    }

    &:disabled {
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
      cursor: not-allowed;
    }

    label {
      cursor: unset;
    }
  }

  &-add-btn {
    margin-left: var(--kui-space-20, $kui-space-20);
  }
}
</style>
