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
        v-for="entry in entries"
        :key="entry.id"
      >
        <div
          v-if="entry.key"
          class="vault-list-item"
        >
          <div class="vault-list-item-key">
            <KeyIcon
              :color="KUI_COLOR_TEXT_NEUTRAL"
              :size="16"
            />
            <div class="vault-list-item-key-text">
              {{ entry.key }}
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
                @click="handleEdit(entry)"
              >
                {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.edit') }}
              </KDropdownItem>
              <KDropdownItem
                danger
                @click="handleRemove(entry)"
              >
                {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.delete') }}
              </KDropdownItem>
            </template>
          </KDropdown>
        </div>
      </template>
    </div>

    <VaultSecretPicker
      :is-editing="!!selectedEntry && !creatingEntryId"
      :secret-name="selectedEntry?.key"
      :secret-ref="selectedEntry?.value"
      :validate-name="validateName"
      @cancel="closeVaultSecretPicker"
      @proceed="handleVaultSecretSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../../../../../composables'
import { AddIcon, MoreIcon, KeyIcon } from '@kong/icons'
import VaultSecretPicker from '../VaultSecretPicker.vue'
import type {
  KeyValueFieldProps,
  KeyValueFieldEmits,
} from '../../../shared/headless/useKeyValueField'
import { useKeyValueField } from '../../../shared/headless/useKeyValueField'
import type { KeyId } from '../../../shared/composables/kv'
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_COLOR_TEXT,
} from '@kong/design-tokens'
import type { FieldName } from '../../types'

interface Emits extends KeyValueFieldEmits {
  'update': [name: FieldName, value: string, oldName?: FieldName]
  'add': [name: FieldName, value: string]
  'remove': [name: FieldName]
}

const props = defineProps<KeyValueFieldProps<FieldName>>()
const emit = defineEmits<Emits>()

const {
  entries,
  addEntry,
  removeEntry,
  updateKey,
  updateValue,
} = useKeyValueField<string>(props, emit)
const selectedEntryId = ref<KeyId | null>(null)
const creatingEntryId = ref<KeyId | null>(null)

const { i18n: { t } } = composables.useI18n()

const selectedEntry = computed(() => {
  if (!selectedEntryId.value) return null
  return entries.value.find(e => e.id === selectedEntryId.value) ?? null
})

const vaultNames = computed(() => {
  return new Set(entries.value.map((e) => e.key))
})

const handleAdd = () => {
  const id = addEntry()
  creatingEntryId.value = id
  selectedEntryId.value = id
}

const closeVaultSecretPicker = () => {
  selectedEntryId.value = null
  if (creatingEntryId.value) {
    removeEntry(creatingEntryId.value)
    creatingEntryId.value = null
  }
}

const handleVaultSecretSelected = (data: { secretRef: string, secretName: string }) => {
  if (!selectedEntry.value) throw new Error('no selected entry')
  const oldName = selectedEntry.value.key as FieldName
  const hasNameChanged = oldName !== data.secretName
  const hasValueChanged = selectedEntry.value.value !== data.secretRef
  const hasChanged = hasNameChanged || hasValueChanged

  updateValue(selectedEntry.value.id, data.secretRef)
  updateKey(selectedEntry.value.id, data.secretName)

  if (creatingEntryId.value) {
    emit('add', data.secretName as FieldName, data.secretRef)
  } else if (hasChanged) {
    emit(
      'update',
      data.secretName as FieldName,
      data.secretRef,
      hasNameChanged ? oldName : undefined,
    )
  }

  creatingEntryId.value = null
  closeVaultSecretPicker()
}

const handleEdit = (entry: { id: KeyId }) => {
  selectedEntryId.value = entry.id
}

const handleRemove = (entry: { id: KeyId, key: string }) => {
  removeEntry(entry.id)
  emit('remove', entry.key as FieldName)
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
    margin-top: $kui-space-40;
  }

  .vault-list {
    display: flex;
    flex-direction: column;
    gap: $kui-space-20;
    overflow: hidden;

    &-item {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: 0 $kui-space-20;

      &-key {
        align-items: center;
        display: flex;
        gap: $kui-space-20;
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
