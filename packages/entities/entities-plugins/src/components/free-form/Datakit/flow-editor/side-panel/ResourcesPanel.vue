<template>
  <div class="dk-resources-panel">
    <Form
      :data="vaultFormData"
      :schema="resourcesSchema"
    >
      <VaultField
        name="vault"
        @add="addVault"
        @remove="removeVault"
        @update="handleUpdateVault"
      />
    </Form>

    <hr class="dk-resources-divider">

    <Form
      :key="`${cacheFormKey}`"
      :data="cacheFormData"
      :schema="resourcesSchema"
    >
      <CacheField
        :strategy="cacheFormData.cache?.strategy"
        @cancel="handleCancelUpdateCache"
        @remove="handleRemoveCache"
        @update="handleUpdateCache"
      />
    </Form>
  </div>
</template>

<script setup lang="ts">
import { useVaultForm } from '../composables/useVaultForm'
import Form from '../../../shared/Form.vue'
import VaultField from './VaultField.vue'

import type { FieldName } from '../../types'
import { useResourcesSchema } from '../composables/useResourcesSchema'
import CacheField, { type FormData as CacheFormData } from './CacheField.vue'
import { useEditorStore } from '../store/store'
import { computed, ref } from 'vue'

const resourcesSchema = useResourcesSchema()
const cacheFormKey = ref(0)

const {
  addVault,
  removeVault,
  updateVault,
  renameVault,
  formData: vaultFormData,
} = useVaultForm()

function handleUpdateVault(name: FieldName, value: string, oldName?: FieldName) {
  if (oldName && oldName !== name) {
    renameVault(oldName, name, false)
  }
  updateVault(name, value)
}

const { state, commit } = useEditorStore()

const cacheFormData = computed<CacheFormData>(() => ({ cache: state.value.cacheConfig }))

function handleUpdateCache(config: CacheFormData) {
  state.value.cacheConfig = config.cache
  commit()
}

function handleRemoveCache() {
  state.value.cacheConfig = undefined
  commit()
}

function handleCancelUpdateCache() {
  // Force re-render CacheField to reset its internal state
  cacheFormKey.value++
}

</script>

<style lang="scss" scoped>
.dk-resources-panel {
  padding: $kui-space-60 0;

  :deep(.title) {
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-bold;
    gap: $kui-space-40;
    line-height: $kui-line-height-30;
    margin: 0;
  }

  .dk-resources-divider {
    background-color: $kui-color-background-disabled;
    border: none;
    height: 1px;
    margin: $kui-space-60 0;
  }
}
</style>
