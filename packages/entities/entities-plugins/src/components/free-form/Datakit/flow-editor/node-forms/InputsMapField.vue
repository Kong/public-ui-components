<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    ref="root"
    class="dk-inputs-map-field"
  >
    <div
      v-for="([keyId, key], index) of sortedKeys"
      :key="keyId"
      class="dk-inputs-map-field-entry"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <KLabel :for="`ff-kv-entry-key-${field.path.value}.${index}`">
        {{ t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label') }}
      </KLabel>
      <div class="dk-inputs-map-field-entry-body">
        <div class="dk-inputs-map-field-entry-content">
          <KInput
            :id="`ff-kv-entry-key-${field.path.value}.${index}`"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :error="!!errorMap[keyId]"
            :error-message="errorMap[keyId]"
            :model-value="editingKeyNames[keyId] ?? key"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input_name.placeholder')"
            @blur="handleInputsNameBlur(keyId)"
            @change="handleInputsNameChange(keyId)"
            @focus="handleBeforeInputsNameChange(keyId)"
            @update:model-value="value => handleKeyNameInput(keyId, value)"
          />
          <KSelect
            class="ff-kv-field-entry-value"
            clearable
            :data-testid="`ff-value-${field.path.value}.${index}`"
            enable-filtering
            :items="items"
            :label="t('plugins.free-form.datakit.flow_editor.node_properties.input.source')"
            :model-value="mapValue?.[keyId]"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
            @change="selectItem => handleInputsValueChange(keyId, selectItem?.value ?? null)"
          >
            <template
              v-if="$slots['item-label']"
              #item-template="{ item }"
            >
              <slot
                name="item-label"
                v-bind="item"
              />
            </template>
          </KSelect>
        </div>
        <KButton
          appearance="tertiary"
          class="dk-inputs-map-field-remove-btn"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="handleRemoveKey(keyId, key)"
        >
          <CloseIcon />
        </KButton>
      </div>
    </div>

    <KButton
      appearance="tertiary"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      :disabled="!!addingKeyId"
      @click="handleAddClick"
    >
      <AddIcon />
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.input.add_button') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, ref, watch, computed, toRef } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import useI18n from '../../../../../composables/useI18n'
import { useField, useMapField } from '../../../shared/composables'
import type { KeyId } from '../../../shared/composables/key-id-map'
import type { FieldName, IdConnection } from '../../types'
import type { InputOption, useNodeForm } from '../composables/useNodeForm'

interface Props {
  name: string
  items: InputOption[]
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
  keyOrder?: FieldName[]
}

interface Emits {
  'change:inputs': [name: FieldName, value: IdConnection | null]
  'add:field': [name: FieldName, value?: IdConnection | null]
  'remove:field': [name: FieldName]
  'rename:field': [oldName: FieldName, newName: FieldName]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  keys,
  addKey,
  removeKey,
  updateKey,
  getKeyName,
  field,
} = useMapField<IdConnection, FieldName>(toRef(props, 'name'))

const { value: mapValue } = useField<Record<KeyId, IdConnection>>(toRef(props, 'name'))

const { i18n: { t } } = useI18n()
const root = useTemplateRef('root')
const addingKeyId = ref<KeyId | null>(null)
const errorMap = ref<Record<string, string>>({})
const editingKeyNames = ref<Partial<Record<KeyId, FieldName>>>({})

let fieldNameBeforeChange: FieldName

const sortedKeys = computed(() => {
  if (!props.keyOrder?.length) {
    return keys.value
  }

  return [...keys.value].sort((a, b) => {
    const indexA = props.keyOrder!.indexOf(a[1])
    const indexB = props.keyOrder!.indexOf(b[1])
    return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
  })
})

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddClick() {
  const keyId = addKey()
  if (!keyId) {
    return
  }

  editingKeyNames.value[keyId] = '' as FieldName
  const index = sortedKeys.value.findIndex(([, key]) => !key)
  focus(index === -1 ? sortedKeys.value.length - 1 : index)

  addingKeyId.value = keyId
}

function handleRemoveKey(keyId: KeyId, key: FieldName) {
  removeKey(keyId)
  delete editingKeyNames.value[keyId]
  delete errorMap.value[keyId]
  if (keyId === addingKeyId.value) {
    addingKeyId.value = null
  }
  if (key.trim() !== '') {
    emit('remove:field', key)
  }
}

function handleBeforeInputsNameChange(keyId: KeyId) {
  fieldNameBeforeChange = (editingKeyNames.value[keyId] ?? getKeyName(keyId) ?? '') as FieldName
}

function handleKeyNameInput(keyId: KeyId, value: string) {
  const trimmedValue = value.trim() as FieldName
  editingKeyNames.value[keyId] = trimmedValue
  validateFieldName(keyId, trimmedValue)
}

function handleInputsNameChange(keyId: KeyId) {
  const newName = (editingKeyNames.value[keyId] ?? getKeyName(keyId) ?? '') as FieldName

  if (validateFieldName(keyId, newName)) {
    editingKeyNames.value[keyId] = fieldNameBeforeChange
    updateKey(keyId, fieldNameBeforeChange)
    delete errorMap.value[keyId]
    return
  }

  if (keyId === addingKeyId.value) {
    if (newName.trim() === '') {
      return
    }
    updateKey(keyId, newName)
    emit('add:field', newName, mapValue?.value?.[keyId] ?? null)
    addingKeyId.value = null
  } else {
    updateKey(keyId, newName)
    emit('rename:field', fieldNameBeforeChange, newName)
  }

  delete errorMap.value[keyId]
  fieldNameBeforeChange = newName
}

function validateFieldName(keyId: KeyId, currentValue: FieldName) {
  delete errorMap.value[keyId]
  const err = props.fieldNameValidator(
    'input',
    fieldNameBeforeChange,
    currentValue,
  )
  if (err) {
    errorMap.value[keyId] = err
    return err
  }
}

function handleInputsNameBlur(keyId: KeyId) {
  validateFieldName(keyId, (editingKeyNames.value[keyId] ?? getKeyName(keyId) ?? '') as FieldName)
}

function handleInputsValueChange(keyId: KeyId, value: IdConnection | null) {
  if (mapValue?.value) {
    mapValue.value[keyId] = value as IdConnection
  }

  if (keyId === addingKeyId.value) {
    return
  }

  const key = getKeyName(keyId)
  if (key) {
    emit('change:inputs', key, value)
  }
}

watch(keys, (newKeys) => {
  const existingIds = new Set(newKeys.map(([id]) => id))

  Object.keys(editingKeyNames.value).forEach((keyId) => {
    if (!existingIds.has(keyId as KeyId)) {
      delete editingKeyNames.value[keyId as KeyId]
      delete errorMap.value[keyId]
    } else {
      editingKeyNames.value[keyId as KeyId] = (editingKeyNames.value[keyId as KeyId] ?? getKeyName(keyId as KeyId) ?? '') as FieldName
    }
  })

  newKeys.forEach(([keyId, key]) => {
    editingKeyNames.value[keyId] = (editingKeyNames.value[keyId] ?? key) as FieldName
  })

  if (addingKeyId.value && !existingIds.has(addingKeyId.value)) {
    addingKeyId.value = null
  }
}, { immediate: true })

watch(() => props.keyOrder, () => {
  if (!addingKeyId.value) {
    return
  }

  const index = sortedKeys.value.findIndex(([keyId]) => keyId === addingKeyId.value)
  if (index !== -1) {
    focus(index)
  }
})
</script>

<style lang="scss" scoped>
.dk-inputs-map-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-60, $kui-space-60);

  &-entry {
    width: 100%;

    &-body {
      align-items: flex-start;
      display: flex;
    }

    &-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--kui-space-40, $kui-space-40);
    }
  }

  &-remove-btn {
    margin-top: 4.5px;
  }
}
</style>
