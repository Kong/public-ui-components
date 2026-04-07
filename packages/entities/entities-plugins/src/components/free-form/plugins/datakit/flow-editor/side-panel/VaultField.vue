<template>
  <div class="dk-vault-panel">
    <h3 class="title">
      {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.title') }}
    </h3>

    <KButton
      appearance="tertiary"
      class="add-button"
      size="small"
      @click="handleAdd"
    >
      <AddIcon />
      {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.add_button') }}
    </KButton>

    <div class="vault-list">
      <template
        v-for="([keyId, key]) in keys"
        :key="keyId"
      >
        <div
          v-if="key"
          class="vault-list-item"
        >
          <div class="vault-list-item-key">
            <KeyIcon
              :color="KUI_COLOR_TEXT_NEUTRAL"
              :size="16"
            />
            <div class="vault-list-item-key-text">
              {{ key }}
            </div>
          </div>
          <KDropdown>
            <KButton
              appearance="tertiary"
              icon
            >
              <MoreIcon :color="KUI_COLOR_TEXT" />
            </KButton>

            <template #items>
              <KDropdownItem
                @click="handleEdit(keyId)"
              >
                {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.edit') }}
              </KDropdownItem>
              <KDropdownItem
                danger
                @click="handleRemove(keyId)"
              >
                {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.delete') }}
              </KDropdownItem>
            </template>
          </KDropdown>
        </div>
      </template>
    </div>

    <VaultSecretPicker
      :is-editing="!!selectedKeyId && !creatingKeyId"
      :secret-name="selectedEntry?.key"
      :secret-ref="selectedEntry?.value"
      :validate-name="validateName"
      @cancel="closeVaultSecretPicker"
      @proceed="handleVaultSecretSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import composables from '../../../../../../composables'
import { AddIcon, MoreIcon, KeyIcon } from '@kong/icons'
import VaultSecretPicker from '../VaultSecretPicker.vue'
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_COLOR_TEXT,
} from '@kong/design-tokens'
import type { FieldName } from '../../types'
import { useMapField, useField } from '../../../../shared/composables'
import type { KeyId } from '../../../../shared/composables/key-id-map'
import type { BaseFieldProps } from 'src/components/free-form/shared/types'

interface Emits {
  'update': [name: FieldName, value: string, oldName?: FieldName]
  'add': [name: FieldName, value: string]
  'remove': [name: FieldName]
}

const props = defineProps<BaseFieldProps>()
const emit = defineEmits<Emits>()

const {
  keys,
  addKey,
  removeKey,
  updateKey,
  getKeyName,
} = useMapField<string, FieldName>(toRef(props, 'name'))

const field = useField<Record<KeyId, string>>(toRef(props, 'name'))

const selectedKeyId = ref<KeyId | null>(null)
const creatingKeyId = ref<KeyId | null>(null)

const selectedEntry = computed(() => {
  if (!selectedKeyId.value) return null
  const key = getKeyName(selectedKeyId.value)
  const value = field.value ? field.value.value[selectedKeyId.value] : undefined
  if (key === undefined || value === undefined) return null
  return {
    id: selectedKeyId.value,
    key,
    value,
  }
})

const { i18n: { t } } = composables.useI18n()

const vaultNames = computed(() => {
  return new Set(keys.value.map(([, name]) => name))
})

const handleAdd = () => {
  const fieldValue = field.value
  if (!fieldValue) return
  const kId = addKey()!
  creatingKeyId.value = kId
  selectedKeyId.value = kId
}

const closeVaultSecretPicker = () => {
  selectedKeyId.value = null
  if (creatingKeyId.value) {
    removeKey(creatingKeyId.value)
    creatingKeyId.value = null
  }
}

const handleVaultSecretSelected = (data: { secretRef: string, secretName: string }) => {
  if (!selectedEntry.value) throw new Error('no selected entry')
  const oldName = selectedEntry.value.key
  const hasNameChanged = oldName !== data.secretName
  const hasValueChanged = selectedEntry.value.value !== data.secretRef
  const hasChanged = hasNameChanged || hasValueChanged

  selectedEntry.value!.value = data.secretRef
  selectedEntry.value!.key = data.secretName as FieldName

  if (hasValueChanged) {
    field.value!.value[selectedEntry.value.id] = data.secretRef // Update freeform data
  }

  if (hasNameChanged) {
    updateKey(selectedEntry.value.id, data.secretName as FieldName) // Update key map
  }

  if (creatingKeyId.value) {
    emit('add', data.secretName as FieldName, data.secretRef)
  } else if (hasChanged) {
    emit(
      'update',
      data.secretName as FieldName,
      data.secretRef,
      hasNameChanged ? oldName : undefined,
    )
  }

  creatingKeyId.value = null
  closeVaultSecretPicker()
}

const handleEdit = (kid: KeyId) => {
  selectedKeyId.value = kid
}

const handleRemove = (kid: KeyId) => {
  const keyName = getKeyName(kid)!
  removeKey(kid)
  emit('remove', keyName)
}

const validateName = (name: string, isEditing: boolean): string | undefined => {
  if (!name) {
    return t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.name_required_error')
  }

  if (vaultNames.value.has(name as FieldName) && !(isEditing && name === selectedEntry.value?.key)) {
    return t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.name_exists_error')
  }
  return undefined
}
</script>

<style lang="scss" scoped>
.dk-vault-panel {
  .add-button {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .vault-list {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-20, $kui-space-20);
    overflow: hidden;

    &-item {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: 0 var(--kui-space-20, $kui-space-20);

      &-key {
        align-items: center;
        display: flex;
        gap: var(--kui-space-20, $kui-space-20);
        overflow: hidden;

        &-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
