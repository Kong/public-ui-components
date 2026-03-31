<template>
  <StandardLayout
    v-bind="props"
    :on-form-change="handleFormChange"
  >
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

    <ObjectField
      as-child
      name="config"
      :omit="['allow', 'deny']"
      reset-label-path="reset"
    />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide, ref, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import { KCard, KRadio } from '@kong/kongponents'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import ObjectField from '../shared/ObjectField.vue'
import useI18n from '../../../composables/useI18n'
import Field from '../shared/Field.vue'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'

type AclConfig = {
  allow?: string[]
  deny?: string[]
}

type AclMode = 'allow' | 'deny'

const props = defineProps<Props<FreeFormPluginData<AclConfig>>>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const mode = ref<AclMode>('allow')
const userSelectedMode = ref(false)
const latestValue = ref<Partial<FreeFormPluginData<AclConfig>>>(props.model)
const latestFields = ref<string[] | undefined>(undefined)

const { i18n: { t } } = useI18n()


const modeLabels = {
  allow: t('plugins.free-form.acl.mode.allow'),
  deny: t('plugins.free-form.acl.mode.deny'),
}

watch(() => props.model, (model) => {
  if (userSelectedMode.value) return
  mode.value = getInitialMode(model)
}, { deep: true, immediate: true })

function getInitialMode(model: FreeFormPluginData<AclConfig>): AclMode {
  const deny = model?.config?.deny
  const allow = model?.config?.allow

  if (Array.isArray(deny) && deny.length > 0) {
    return 'deny'
  }

  if (Array.isArray(allow) && allow.length > 0) {
    return 'allow'
  }

  return 'allow'
}

function handleFormChange(value: Partial<FreeFormPluginData<AclConfig>>, fields?: string[]) {
  if (!value) return

  latestValue.value = value
  latestFields.value = fields

  const nextValue = cloneDeep(value)

  if (nextValue.config) {
    if (mode.value === 'allow') {
      delete nextValue.config.deny
    } else {
      delete nextValue.config.allow
    }
  }

  props.onFormChange(nextValue, fields)
}

function handleModeChange(nextMode: AclMode) {
  if (nextMode === mode.value) {
    return
  }

  mode.value = nextMode
  userSelectedMode.value = true

  const nextValue = cloneDeep(latestValue.value)
  if (nextValue.config) {
    if (mode.value === 'allow') {
      delete nextValue.config.deny
    } else {
      delete nextValue.config.allow
    }
  }

  props.onFormChange(nextValue, latestFields.value)
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
