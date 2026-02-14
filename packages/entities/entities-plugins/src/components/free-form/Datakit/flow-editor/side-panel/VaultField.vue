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
      :is-editing="!!selectedEntry && !creatingEntry"
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
  KVEntry,
} from '../../../shared/headless/useKeyValueField'
import { useKeyValueField } from '../../../shared/headless/useKeyValueField'
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

type VaultKVEntry = KVEntry<FieldName, string>

const props = defineProps<KeyValueFieldProps<FieldName>>()
const emit = defineEmits<Emits>()

const {
  entries,
  addEntry,
  removeEntry,
} = useKeyValueField<FieldName, string>(props, emit)
const selectedEntry = ref<VaultKVEntry | null>(null)
const creatingEntry = ref<VaultKVEntry | null>(null)

const { i18n: { t } } = composables.useI18n()

const vaultNames = computed(() => {
  return new Set(entries.value.map((e) => e.key))
})

const handleAdd = () => {
  const newEntry = addEntry()
  creatingEntry.value = newEntry
  selectedEntry.value = newEntry
}

const closeVaultSecretPicker = () => {
  selectedEntry.value = null
  if (creatingEntry.value) {
    removeEntry(creatingEntry.value.id)
    creatingEntry.value = null
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

  if (creatingEntry.value) {
    emit('add', data.secretName as FieldName, data.secretRef)
  } else if (hasChanged) {
    emit(
      'update',
      data.secretName as FieldName,
      data.secretRef,
      hasNameChanged ? oldName : undefined,
    )
  }

  creatingEntry.value = null
  closeVaultSecretPicker()
}

const handleEdit = (entry: VaultKVEntry) => {
  selectedEntry.value = entry
}

const handleRemove = (entry: VaultKVEntry) => {
  removeEntry(entry.id)
  emit('remove', entry.key)
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
