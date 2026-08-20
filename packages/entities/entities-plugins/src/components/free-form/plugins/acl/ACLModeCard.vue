<template>
  <div class="ff-acl-mode">
    <KLabel
      class="ff-acl-mode-label"
      :info="hasExpressionModes ? t('plugins.free-form.acl.mode.title.description') : undefined"
      :tooltip-attributes="{ maxWidth: '300px' }"
    >
      {{ t('plugins.free-form.acl.mode.title.label') }}
    </KLabel>
    <div class="ff-acl-mode-options">
      <KRadio
        v-for="item in MODES"
        :key="item"
        v-model="mode"
        card
        card-orientation="horizontal"
        :data-testid="`ff-acl-mode-${item}`"
        :description="t(`plugins.free-form.acl.mode.${item}.description`)"
        :label="t(`plugins.free-form.acl.mode.${item}.label`)"
        :selected-value="item"
        @update:model-value="handleModeChange"
      />
    </div>
  </div>

  <!--
    `:key="mode"` is required, not cosmetic: all four config fields render through
    the same component, so without an explicit key Vue would patch props onto the
    reused instance rather than unmounting/remounting it when the mode changes,
    leaving stale per-field state (label, input value) behind.
  -->
  <ArrayField
    :key="mode"
    :add-item-label="t(`plugins.free-form.acl.field.${mode}.add`)"
    :label="t(`plugins.free-form.acl.field.${mode}.label`)"
    :label-attributes="labelAttributes"
    :name="`config.${mode}`"
  >
    <template #item="{ autofocus, fieldName }">
      <StringField
        :autofocus="autofocus"
        :multiline="isExpressionMode"
        :name="fieldName"
        :placeholder="t(`plugins.free-form.acl.field.${mode}.placeholder`)"
        :rows="isExpressionMode ? 2 : undefined"
      >
        <!-- Only the CEL modes need the syntax hint; allow/deny take plain group names. -->
        <template
          v-if="isExpressionMode"
          #help
        >
          <i18nT :keypath="expressionKeys.helpText">
            <template #link>
              <KExternalLink
                hide-icon
                :href="externalLinks.condition"
              >
                {{ t(expressionKeys.helpLearn) }}
              </KExternalLink>
            </template>
          </i18nT>
        </template>
      </StringField>
    </template>
  </ArrayField>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { KExternalLink, KRadio } from '@kong/kongponents'
import { useFormShared } from '../../shared/composables'
import ArrayField from '../../shared/ArrayField.vue'
import StringField from '../../shared/StringField.vue'
import externalLinks from '../../../../external-links'
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

// The two `*_when` modes hold CEL expressions, which are long enough to warrant a
// textarea instead of the single-line input the schema type would otherwise get.
const EXPRESSION_MODES: AclMode[] = ['allow_when', 'deny_when']

const { formData, getLabelAttributes, getSchema, getEmptyValue } = useFormShared<FreeFormPluginData<AclConfig>>()
const { i18n: { t }, i18nT } = useI18n()

// allow_when/deny_when are newer additions to the ACL plugin's schema; a Gateway
// version that predates them simply won't declare the fields, so hide those modes
// instead of offering a selection that has nowhere to write its data.
const MODES = computed(() => ALL_MODES.filter((m) => !!getSchema(`config.${m}`)))

const mode = ref<AclMode>('allow')
const isExpressionMode = computed(() => EXPRESSION_MODES.includes(mode.value))

// With only allow/deny available the radios are self-explanatory, and the tooltip
// copy talks about a choice the Gateway version cannot offer — so drop it entirely.
const hasExpressionModes = computed(() => MODES.value.some((m) => EXPRESSION_MODES.includes(m)))

// Spelled out rather than interpolated from `mode`: only the two expression modes
// declare these keys, and literal keys keep the i18n key type-checking meaningful.
const expressionKeys = computed(() => mode.value === 'deny_when'
  ? {
    description: 'plugins.free-form.acl.field.deny_when.description',
    helpText: 'plugins.free-form.acl.field.deny_when.help.text',
    helpLearn: 'plugins.free-form.acl.field.deny_when.help.learn',
  } as const
  : {
    description: 'plugins.free-form.acl.field.allow_when.description',
    helpText: 'plugins.free-form.acl.field.allow_when.help.text',
    helpLearn: 'plugins.free-form.acl.field.allow_when.help.learn',
  } as const)

// allow/deny keep the tooltip the schema's own `description` generates. The CEL modes
// override it, because their schema text describes the API contract rather than the
// concept the form needs to explain.
const labelAttributes = computed(() => {
  const schemaAttributes = getLabelAttributes(`config.${mode.value}`)

  return isExpressionMode.value
    ? { ...schemaAttributes, info: t(expressionKeys.value.description) }
    : schemaAttributes
})

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
    config[m] = getEmptyValue()
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
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);

  // The container gap owns the label-to-cards spacing.
  // `.k-label` is required to override styles correctly in KM.
  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-options {
    display: flex;
    gap: var(--kui-space-50, $kui-space-50);
  }
}
</style>
