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
                Edit
              </KDropdownItem>
              <KDropdownItem
                danger
                @click="handleRemove(entry)"
              >
                Remove
              </KDropdownItem>
            </template>
          </KDropdown>
        </div>
      </template>
    </div>

    <VaultSecretPicker
      :key="`dk-vsp-${selectedEntry?.id}`"
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
import VaultSecretPicker from './VaultSecretPicker.vue'
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

const props = defineProps<KeyValueFieldProps>()
const emit = defineEmits<KeyValueFieldEmits>()

const {
  entries,
  addEntry,
  removeEntry,
} = useKeyValueField<string, string>(props, emit)
const selectedEntry = ref<KVEntry | null>(null)
const creatingEntry = ref<KVEntry | null>(null)

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

  selectedEntry.value!.value = data.secretRef
  selectedEntry.value!.key = data.secretName

  creatingEntry.value = null
  closeVaultSecretPicker()
}

const handleEdit = (entry: KVEntry) => {
  selectedEntry.value = entry
}

const handleRemove = (entry: KVEntry) => {
  removeEntry(entry.id)
}

const validateName = (name: string): string | undefined => {
  if (!name) {
    return t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.name_required_error')
  }

  if (vaultNames.value.has(name)) {
    return t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.name_exists_error')
  }
  return undefined
}
</script>

<style lang="scss" scoped>
.dk-vault-panel {
  .add-button {
    margin: $kui-space-40 0;
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
