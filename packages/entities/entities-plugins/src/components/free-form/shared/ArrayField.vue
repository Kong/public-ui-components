<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    v-show="!hide"
    ref="root"
    class="ff-array-field"
    :class="{
      [`ff-array-field-${realAppearance ?? 'default'}`]: true,
      'ff-array-field-sticky-tabs': stickyTabs,
    }"
    :data-testid="`ff-array-${field.path.value}`"
  >
    <header
      class="ff-array-field-header"
      :data-testid="`ff-array-header-${field.path.value}`"
    >
      <KLabel
        class="ff-array-field-label"
        v-bind="fieldAttrs"
        :data-testid="`ff-label-${field.path.value}`"
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
      <KButton
        v-if="appearance === 'tabs'"
        appearance="tertiary"
        :aria-label="t('actions.add_entity', { entity: t('plugins.free-form.request-callout.entity_name') })"
        :data-testid="`ff-add-item-btn-${field.path.value}`"
        :disabled="field.isInheritedDisabled.value"
        icon
        @click="addItem"
      >
        <AddIcon />
      </KButton>
    </header>

    <template v-if="realAppearance !== 'tabs'">
      <div
        class="ff-array-field-container"
        :data-testid="`ff-array-basic-container-${field.path.value}`"
      >
        <ListTag
          v-for="(item, index) of realItems"
          :key="getKey(item, index)"
          class="ff-array-field-item"
          :class="{ 'ff-array-field-item-card': realAppearance === 'card' }"
          :data-index="index"
          :data-testid="`ff-array-item-${field.path.value}.${index}`"
        >
          <div class="ff-array-field-item-content">
            <slot
              v-if="$slots.item"
              data-autofocus
              :field-name="String(index)"
              :index="index"
              name="item"
            />
            <StringArrayField
              v-if="subSchema.type === 'array' && subSchema.elements.type === 'string'"
              :help="t('plugins.free-form.tag_helper')"
              :name="String(index)"
            />
            <Field
              v-else
              :name="String(index)"
            />
          </div>
          <KTooltip
            class="ff-array-field-item-remove-tooltip"
            :text="`Remove ${fieldAttrs.label}`"
          >
            <KButton
              appearance="tertiary"
              :aria-label="t('actions.remove_entity', { entity: t('plugins.free-form.request-callout.entity_name') })"
              class="ff-array-field-item-remove"
              :data-testid="`ff-array-remove-item-btn-${field.path.value}.${index}`"
              :disabled="field.isInheritedDisabled.value"
              icon
              @click.stop="removeItem(index)"
            >
              <CloseIcon />
            </KButton>
          </KTooltip>
        </ListTag>
      </div>

      <KButton
        appearance="tertiary"
        :aria-label="t('actions.add_entity', { entity: t('plugins.free-form.request-callout.entity_name') })"
        class="ff-array-field-add-item-btn"
        :data-testid="`ff-add-item-btn-${field.path.value}`"
        :disabled="field.isInheritedDisabled.value"
        @click="addItem"
      >
        <AddIcon />
        {{ t('actions.add_entity', { entity: fieldAttrs.label }) }}
      </KButton>
    </template>

    <KCard
      v-else-if="realItems.length"
      :data-testid="`ff-array-tab-container-${field.path.value}`"
    >
      <KTabs
        v-model="activeTab"
        :data-testid="`ff-array-tabs-${field.path.value}`"
        :tabs="tabs"
      >
        <template
          v-for="(item, index) of realItems"
          :key="getKey(item, index)"
          #[getKey(item,index)]
        >
          <div
            class="ff-array-field-item"
            :data-index="index"
            :data-testid="`ff-array-item-${field.path.value}.${index}`"
          >
            <slot
              v-if="$slots.item"
              :field-name="String(index)"
              :index="index"
              name="item"
            />
            <Field
              v-else
              :name="String(index)"
            />
          </div>
        </template>
        <template
          v-for="(item, index) of realItems"
          :key="getKey(item, index)"
          #[`${getKey(item,index)}-anchor`]
        >
          {{ getTabTitle(item, index) }}
          <KButton
            appearance="tertiary"
            :aria-label="t('actions.remove_entity', { entity: t('plugins.free-form.request-callout.entity_name') })"
            class="ff-array-field-item-remove"
            :data-testid="`ff-array-remove-item-btn-${field.path.value}.${index}`"
            :disabled="field.isInheritedDisabled.value"
            icon
            @click.stop="removeItem(index)"
          >
            <TrashIcon />
          </KButton>
        </template>
      </KTabs>
    </KCard>
  </div>
</template>

<script setup lang="ts" generic="T">
import { useTemplateRef, nextTick, computed, ref, toValue, toRef, useAttrs } from 'vue'
import { AddIcon, TrashIcon, CloseIcon } from '@kong/icons'
import { KCard, type LabelAttributes } from '@kong/kongponents'
import { useField, useFieldAttrs, useFormShared, useItemKeys } from './composables'
import useI18n from '../../../composables/useI18n'
import * as utils from './utils'
import Field from './Field.vue'
import type { ArrayLikeFieldSchema } from '../../../types/plugins/form-schema'
import StringArrayField from './StringArrayField.vue'
import type { BaseFieldProps } from './types'

const props = defineProps<{
  name: string
  items?: T[] | null
  label?: string
  labelAttributes?: LabelAttributes
  itemLabel?: string | ((item: T, index: number) => string)
  appearance?: 'default' | 'card' | 'tabs'
  stickyTabs?: boolean | string | number
} & BaseFieldProps>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

defineSlots<{
  item(props: {
    index: number
    /** for named slot, the field name use `fieldName` instead */
    fieldName: string
    'data-autofocus'?: boolean
  }): any
  tooltip(): any
}>()

const { i18n: { t } } = useI18n()
const { getDefault, getSchema } = useFormShared()
const { value: fieldValue, hide, ...field } = useField<T[] | null>(toRef(props, 'name'))
const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))
const subSchema = computed(() => {
  if (!field.path) throw new Error('Field path is required for sub-schema retrieval')
  const schema = getSchema<ArrayLikeFieldSchema>(field.path.value)
  if (!schema) throw new Error(`Schema not found for path: ${field.path.value}`)
  return schema.elements
})

const realItems = computed(() => props.items ?? toValue(fieldValue) ?? [])

const { getKey } = useItemKeys('ff-array-field', realItems)

const realAppearance = computed(() => {
  if (props.appearance) {
    return props.appearance
  }

  if (subSchema.value.type === 'record') {
    return 'card'
  }

  return 'default'
})

const ListTag = computed(() => {
  return realAppearance.value === 'card' ? KCard : 'div'
})

function getTabTitle(item: T, index: number) {
  return typeof props.itemLabel === 'function'
    ? props.itemLabel(item, index)
    : props.itemLabel || fieldAttrs.value.label || `Item #${index}`
}

const tabs = computed(() => realItems.value.map((item, index) => {
  const hash = `#${getKey(item, index)}`

  return {
    hash,
    title: '',
  }
}))
const activeTab = ref<string>(tabs.value[0]?.hash)

const addItem = async () => {

  const defaultItemValue = getDefault(utils.resolve(field.path!.value, utils.arraySymbol))

  if (!Array.isArray(fieldValue!.value)) {
    fieldValue!.value = []
  }

  fieldValue!.value.push(defaultItemValue)
  emit('add')

  if (props.appearance === 'tabs') {
    await nextTick()
    activeTab.value = tabs.value[tabs.value.length - 1]?.hash
  }

  await nextTick()
  focus(realItems.value.length + 1)
}

const removeItem = async (index: number) => {
  if (Array.isArray(fieldValue!.value)) {
    fieldValue!.value.splice(index, 1)
  }
  emit('remove', index)

  if (props.appearance === 'tabs') {
    activeTab.value = tabs.value[Math.max(0, index - 1)]?.hash
  }
}

const root = useTemplateRef('root')

function focus(index: number) {
  if (!root.value) {
    return
  }

  const i = Math.max(0, Math.min(index, realItems.value.length - 1))
  root.value
    .querySelector<HTMLElement>(`[data-index="${i}"] [data-autofocus]`)
    ?.focus()
}

const stickyTop = computed(() => {
  const { appearance, stickyTabs } = props
  if (appearance !== 'tabs' || stickyTabs == null || stickyTabs === false) {
    return null
  }

  return typeof stickyTabs === 'number'
    ? `${props.stickyTabs}px`
    : typeof stickyTabs === 'string'
      ? stickyTabs
      : '0'
})
</script>

<style lang="scss" scoped>
.ff-array-field {
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

  &-container {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
  }

  &-item {
    display: flex;
    padding: $kui-space-50 $kui-space-60;

    &-content {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $kui-space-60;
    }
  }

  &-default > &-container > &-item {
    align-items: center;
    flex-direction: row;
    gap: $kui-space-40;
    padding: 0;

    // Align delete button to top when using TagField
    &:has(.ff-tag-field) {
      align-items: flex-start;

      .ff-array-field-item-remove {
        margin-top: $kui-space-20;
      }
    }
  }

  &-card > &-container > &-item :deep(.card-content) {
    align-items: center;
    flex-direction: row;
    gap: $kui-space-40;

    // Align delete button to top when using TagField
    &:has(.ff-tag-field) {
      align-items: flex-start;

      .ff-array-field-item-remove {
        margin-top: $kui-space-20;
      }
    }
  }

  &-tabs &-item {
    flex-direction: column;
    gap: $kui-space-80;
  }

  &-sticky-tabs {
    :deep(.k-tabs ul) {
      background-color: $kui-color-background;
      position: sticky;
      top: v-bind('stickyTop');
      z-index: 10;
    }

    :deep(.k-tabs .tab-link:has(.k-button:hover):hover) {
      background-color: transparent;
    }
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }

  &-add-item-btn {
    align-self: flex-start;
  }

  &-item-card {
    padding: $kui-space-70;

    .ff-array-field-item-remove-tooltip {
      align-self: flex-start;
    }
  }
}
</style>
