<template>
  <KCard class="ff-acl-mode-card">
    <div class="ff-acl-mode">
      <KRadio
        v-for="item in MODES"
        :key="item"
        v-model="mode"
        :data-testid="`ff-acl-mode-${item}`"
        :label="t(`plugins.free-form.acl.mode.${item}`)"
        :selected-value="item"
        @update:model-value="handleModeChange"
      />
    </div>

    <!--
      An explicit v-if/v-else-if chain (rather than one Field with a dynamic :name)
      is intentional: Vue 3 gives each conditional branch an implicit unique key, so
      switching modes always fully unmounts/remounts the Field instead of patching
      props onto a reused one — which is what a single dynamic :name would do here,
      since all four config fields render via the same underlying component.
    -->
    <Field
      v-if="mode === 'allow'"
      name="config.allow"
    />
    <Field
      v-else-if="mode === 'deny'"
      name="config.deny"
    />
    <Field
      v-else-if="mode === 'allow_when'"
      name="config.allow_when"
    />
    <Field
      v-else
      name="config.deny_when"
    />
  </KCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { KCard, KRadio } from '@kong/kongponents'
import { useFormShared } from '../../shared/composables'
import Field from '../../shared/Field.vue'
import useI18n from '../../../../composables/useI18n'

import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

type AclConfig = {
  allow?: string[] | null
  deny?: string[] | null
  // allow_when and deny_when are CEL expressions
  allow_when?: string[] | null
  deny_when?: string[] | null
}

type AclMode = keyof AclConfig

// Order matters: radios are rendered in this order, and it is also the priority
// used to detect the active mode on initial load.
const ALL_MODES: AclMode[] = ['allow', 'deny', 'allow_when', 'deny_when']

const { formData, getSchema } = useFormShared<FreeFormPluginData<AclConfig>>()
const { i18n: { t } } = useI18n()

// allow_when/deny_when are newer additions to the ACL plugin's schema; a Gateway
// version that predates them simply won't declare the fields, so hide those modes
// instead of offering a selection that has nowhere to write its data.
const MODES = computed(() => ALL_MODES.filter((m) => !!getSchema(`config.${m}`)))

const mode = ref<AclMode>('allow')
const userSelectedMode = ref(false)
const cache = ref<Partial<Record<AclMode, string[]>>>({})

// Watch formData to detect which mode has data on initial load
watch(() => formData.config, (config) => {
  if (userSelectedMode.value) return
  if (!config) return

  // The modes are mutually exclusive, so at most one of them should hold data
  const active = MODES.value.find((m) => Array.isArray(config[m]) && config[m]!.length > 0)
  if (active) {
    mode.value = active
  }
}, { deep: true, immediate: true })

function handleModeChange() {
  userSelectedMode.value = true

  const config = formData.config
  if (!config) return

  // Cache the other fields before clearing them, so switching back is lossless
  for (const m of MODES.value) {
    if (m === mode.value) continue

    if (config[m]) {
      cache.value[m] = [...config[m]!]
    }
    config[m] = null
  }

  // Restore cached data for the selected mode if it exists
  const cached = cache.value[mode.value]
  if (cached) {
    config[mode.value] = [...cached]
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
