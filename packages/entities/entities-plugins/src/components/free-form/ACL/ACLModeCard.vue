<template>
  <KCard class="ff-acl-mode-card">
    <div class="ff-acl-mode">
      <KRadio
        v-model="mode"
        data-testid="ff-acl-mode-allow"
        :label="modeLabels.allow"
        :selected-value="'allow'"
        @update:model-value="handleModeChange"
      />
      <KRadio
        v-model="mode"
        data-testid="ff-acl-mode-deny"
        :label="modeLabels.deny"
        :selected-value="'deny'"
        @update:model-value="handleModeChange"
      />
    </div>

    <Field
      v-if="mode === 'allow'"
      name="config.allow"
    />
    <Field
      v-else
      name="config.deny"
    />
  </KCard>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { KCard, KRadio } from '@kong/kongponents'
import { useFormShared } from '../shared/composables'
import Field from '../shared/Field.vue'
import useI18n from '../../../composables/useI18n'

import type { FreeFormPluginData } from '../../../types/plugins/free-form'

type AclConfig = {
  allow?: string[]
  deny?: string[]
}

type AclMode = 'allow' | 'deny'

const { formData } = useFormShared<FreeFormPluginData<AclConfig>>()
const { i18n: { t } } = useI18n()

const mode = ref<AclMode>('allow')
const userSelectedMode = ref(false)
const cache = ref<{ allow?: string[], deny?: string[] }>({})

const modeLabels = {
  allow: t('plugins.free-form.acl.mode.allow'),
  deny: t('plugins.free-form.acl.mode.deny'),
}

// Watch formData to detect which mode has data on initial load
watch(() => formData.config, (config) => {
  if (userSelectedMode.value) return
  if (!config) return

  const deny = config.deny
  const allow = config.allow

  if (Array.isArray(deny) && deny.length > 0) {
    mode.value = 'deny'
  } else if (Array.isArray(allow) && allow.length > 0) {
    mode.value = 'allow'
  }
}, { deep: true, immediate: true })

function handleModeChange() {
  userSelectedMode.value = true

  if (!formData.config) return

  // Cache the current field before deleting
  if (mode.value === 'allow') {
    if (formData.config.deny) {
      cache.value.deny = [...formData.config.deny]
    }
    delete formData.config.deny
    // Restore cached allow data if exists
    if (cache.value.allow) {
      formData.config.allow = [...cache.value.allow]
    }
  } else {
    if (formData.config.allow) {
      cache.value.allow = [...formData.config.allow]
    }
    delete formData.config.allow
    // Restore cached deny data if exists
    if (cache.value.deny) {
      formData.config.deny = [...cache.value.deny]
    }
  }
}
</script>

<style lang="scss" scoped>
.ff-acl-mode {
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
  margin-bottom: var(--kui-space-60, $kui-space-60);
}

.ff-acl-mode-card {
  margin-bottom: var(--kui-space-50, $kui-space-50);
}
</style>
