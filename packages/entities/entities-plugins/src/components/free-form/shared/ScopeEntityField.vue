<template>
  <div
    v-show="!hide"
    class="ff-scope-entity-field"
    :data-testid="`ff-${field.path.value}`"
  >
    <KLabel
      v-if="fieldAttrs.label"
      v-bind="fieldAttrs.labelAttributes"
    >
      {{ fieldAttrs.label }}
    </KLabel>

    <FieldScopedEntitySelect
      :id="fieldValue?.id ?? ''"
      :allow-uuid-search="allowUuidSearch"
      :disabled="loading"
      :dom-id="name"
      :entity="entity"
      :field-disabled="disabled"
      :fields="searchFields"
      :initial-item-selected="initialValueSelected"
      :label-field="labelField"
      :placeholder="loading ? t('actions.loading_spinner') : (placeholder || fieldAttrs.placeholder)"
      :selected-item="selectedItem"
      :selected-item-loading="loading"
      @change="handleChange"
    />

    <p
      v-if="help"
      class="ff-scope-entity-help"
    >
      {{ help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, computed, inject, onMounted } from 'vue'
import { KLabel } from '@kong/kongponents'
import {
  FieldScopedEntitySelect,
  FORMS_API_KEY,
} from '@kong-ui-public/forms'
import { useField, useFieldAttrs } from './composables'
import type { BaseFieldProps } from './types'
import type { SelectItem } from '@kong/kongponents'
import type { EntityData } from '@kong-ui-public/forms'
import composables from '../../../composables'

type ForeignFieldValue = { id: string } | null

interface ScopeEntityFieldProps extends BaseFieldProps {
  /** Kong entity type: 'services', 'routes', 'consumers', 'consumer_groups' */
  entity: string
  /** Fields to search/display, e.g. ['name', 'id'] */
  fields?: string[]
  /** Field to use as display label, default 'name' */
  labelField?: string
  label?: string
  placeholder?: string
  help?: string
  disabled?: boolean
}

const {
  name,
  entity,
  fields = ['name', 'id'],
  labelField = 'name',
  disabled,
  placeholder,
  help,
  ...props
} = defineProps<ScopeEntityFieldProps>()

const { i18n: { t } } = composables.useI18n()

const { value: fieldValue, hide, ...field } = useField<ForeignFieldValue>(toRef(() => name))

if (field.error) {
  throw new Error(field.error.message)
}

const fieldAttrs = useFieldAttrs(field.path, props)

const api = inject<Record<string, any>>(FORMS_API_KEY)

const searchFields = computed(() => fields.filter(f => f !== 'id'))
const allowUuidSearch = computed(() => fields.includes('id'))

// --- Edit mode: fetch the currently selected entity ---
const loading = ref(false)
const selectedItem = ref<SelectItem<string> | undefined>()
const initialItem = ref<SelectItem<string> | undefined>()
const initialValueSelected = computed(() => {
  return (fieldValue?.value?.id ?? '') === (initialItem.value?.value ?? '')
})

onMounted(async () => {
  const currentId = fieldValue?.value?.id
  if (!currentId || !api) return

  loading.value = true
  try {
    const res = await api.getOne(entity, currentId, {
      validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
    })
    if (res.status === 404) {
      throw new Error(`Entity of type ${entity} with id ${currentId} not found`)
    }
    const entityData: EntityData = res.data
    const item: SelectItem<string> = {
      ...entityData,
      label: entityData[labelField] ?? entityData.id,
      value: entityData.id,
    }
    initialItem.value = item
    selectedItem.value = item
  } catch (err) {
    console.error('Failed to load selected entity:', err)
    fieldValue.value = null
  } finally {
    loading.value = false
  }
})

// --- Event handling ---
function handleChange(item: SelectItem<string> | null) {
  if (item) {
    fieldValue!.value = { id: item.value }
    selectedItem.value = item
  } else {
    fieldValue!.value = null
    selectedItem.value = undefined
  }
}
</script>

<style lang="scss" scoped>
.ff-scope-entity-field {
  width: 100%;

  .ff-scope-entity-help {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    margin-top: $kui-space-20;
  }
}
</style>
