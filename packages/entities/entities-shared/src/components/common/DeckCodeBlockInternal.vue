<template>
  <div
    class="deck-config config-card-code-block"
    v-bind="$attrs"
  >
    <KSelect
      v-model="shell"
      :items="shells"
    >
      <template #item-template="{ item }">
        <LanguageShellIcon v-if="item.value === 'powershell'" />
        <LanguageBashIcon v-else />
        {{ item.label }}
      </template>
      <template #selected-item-template="{ item }">
        <LanguageShellIcon v-if="item.value === 'powershell'" />
        <LanguageBashIcon v-else />
        {{ item.label }}
      </template>
    </KSelect>

    <div class="step-title">
      {{ t('deckCodeBlock.steps.step_1') }}
    </div>

    <i18nT
      v-if="!isCustomizing"
      :data-testid="`deck-hint-${app}`"
      :keypath="`deckCodeBlock.hint.${app}`"
      tag="p"
    >
      <template
        v-if="app === 'konnect'"
        #token
      >
        <KBadge>DECK_KONNECT_TOKEN</KBadge>
      </template>
      <template #link>
        <KExternalLink :href="app === 'konnect' ? 'https://developer.konghq.com/deck/get-started/' : 'https://developer.konghq.com/deck/gateway/configuration/'">
          {{ i18n.t('deckCodeBlock.documentation') }}
        </KExternalLink>
      </template>
    </i18nT>
    <KCodeBlock
      v-if="app === 'konnect'"
      id="deck-env-codeblock"
      :class="{ customization: props.isCustomizing }"
      :code="envCommand"
      :language="shell"
      single-line
      :theme="isCustomizing ? 'light' : 'dark'"
      @code-block-render="highlightCodeBlock"
    />
    <KAlert
      v-if="Boolean(konnectPat)"
      class="copy-konnect-pat-alert"
    >
      {{ t('deckCodeBlock.customization.copy_pat') }}
    </KAlert>

    <div
      v-else-if="props.isCustomizing && props.generateKonnectPat"
      class="konnect-pat-actions"
    >
      <KButton
        appearance="secondary"
        @click="isGeneratePatModalVisible = true"
      >
        {{ t('deckCodeBlock.customization.generate_pat') }}
      </KButton>
      <div>{{ t('deckCodeBlock.customization.reuse_pat') }}</div>
    </div>

    <div class="step-title">
      {{ t('deckCodeBlock.steps.step_2') }}
    </div>

    <KCodeBlock
      v-if="props.entityRecord && !props.isCustomizing"
      id="deck-codeblock"
      :class="{ customization: props.isCustomizing }"
      :code="deckCommand"
      :copy-code="unredactedCommand"
      data-dd-privacy="mask"
      :language="shell"
      :theme="isCustomizing ? 'light' : 'dark'"
      @code-block-render="highlightCodeBlock"
    />

    <DeckCommandEditor
      v-else-if="props.entityRecord && props.isCustomizing"
      v-model="deckCommand"
      :language="shell"
    />

    <KAlert
      v-if="props.isCustomizing"
      class="customization-footer-reminder"
    >
      <template #icon>
        <InfoIcon />
      </template>

      {{ t('deckCodeBlock.customization.footer_reminder') }}
    </KAlert>
  </div>

  <GeneratePatModal
    v-if="props.isCustomizing && props.generateKonnectPat"
    :generate-konnect-pat="props.generateKonnectPat"
    :visible="isGeneratePatModalVisible"
    @dismiss="isGeneratePatModalVisible = false"
    @generated="handleKonnectPatGenerated"
  />
</template>

<script setup lang="ts">
import { InfoIcon, LanguageBashIcon, LanguageShellIcon } from '@kong/icons'
import { KExternalLink } from '@kong/kongponents'
import yaml from 'js-yaml'
import { computed, defineAsyncComponent, ref, watchEffect } from 'vue'

import composables from '../../composables'
import { SupportedEntityType } from '../../types'
import { highlightCodeBlock } from '../../utils/code-block'
import DeckCommandEditorLoading from './DeckCommandEditorLoading.vue'
import GeneratePatModal from './GeneratePatModal.vue'

import type { DeckCodeBlockProps } from '../../types'

/**
 * Lazy load the Monaco Editor inside when customization mode is enabled.
 */
const DeckCommandEditor = defineAsyncComponent({
  loader: () => import('./DeckCommandEditor.vue'),
  loadingComponent: DeckCommandEditorLoading,
  delay: 200,
})

const props = defineProps<DeckCodeBlockProps & {
  isCustomizing?: boolean
  /**
   * A function to generate a Konnect Personal Access Token (PAT).
   * This enables the user to generate a PAT directly from the UI.
   */
  generateKonnectPat?: (name: string, expiresAt: Date) => string | Promise<string>
}>()

const { i18n, i18nT } = composables.useI18n()
const { t } = i18n

const konnectPat = ref<string>('')
const deckCommand = ref<string>('')
const unredactedDeckCommand = ref<string>('')
const isGeneratePatModalVisible = ref(false)

const shells = [
  { value: 'bash', label: 'Linux / macOS Bash' },
  { value: 'powershell', label: 'Windows PowerShell' },
]

const shell = ref<'bash' | 'powershell'>((() => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('windows')) {
    return 'powershell'
  } else {
    return 'bash'
  }
})())

const baseObject = computed(() => {
  const obj: Record<string, any> = {
    _format_version: '3.0',
  }
  if (props.controlPlaneName) {
    obj._konnect = {
      control_plane_name: props.controlPlaneName,
    }
  } else if (props.workspace) {
    obj._workspace = props.workspace
  }
  return obj
})

const buildYaml = (record: Record<string, any>): string => {
  // filter out null values, empty strings, and empty arrays since decK doesn't accept them [KHCP-10642]
  const filteredRecord = Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length !== 0 : true)))

  // transfer parent object `{id: string}` to just id string for decK compatibility [KM-2056]
  if (props.entityType === SupportedEntityType.Plugin) {
    if (filteredRecord.service?.id) {
      filteredRecord.service = filteredRecord.service.id
    }
    if (filteredRecord.route?.id) {
      filteredRecord.route = filteredRecord.route.id
    }
    if (filteredRecord.consumer?.id) {
      filteredRecord.consumer = filteredRecord.consumer.id
    }
    if (filteredRecord.consumer_group?.id) {
      filteredRecord.consumer_group = filteredRecord.consumer_group.id
    }
  } else if (props.entityType === SupportedEntityType.Key) {
    if (filteredRecord.key_set?.id) {
      filteredRecord.key_set = filteredRecord.key_set.id
    }
  }

  // KeySet is 'set' in terraform but 'key_set' in decK
  const entityKey = props.entityType === SupportedEntityType.KeySet ? 'key_sets' : props.entityType + 's'

  const fullRecord = {
    ...baseObject.value,
    [entityKey]: [filteredRecord],
  }

  return yaml.dump(fullRecord, { quotingType: '"' }).trim()
}

const yamlContent = computed((): string => {
  return buildYaml(props.entityRecord)
})

const unredactedCommand = computed((): string => {
  return buildYaml(props.unredactedRecord || props.entityRecord)
})

const envCommand = computed((): string => {
  if (shell.value === 'bash') {
    return `export DECK_KONNECT_TOKEN='${konnectPat.value || 'YOUR_KONNECT_PAT'}'`
  } else {
    return `$env:DECK_KONNECT_TOKEN = "${konnectPat.value || 'YOUR_KONNECT_PAT'}"`
  }
})

function handleKonnectPatGenerated(token: string) {
  konnectPat.value = token
  isGeneratePatModalVisible.value = false
}

watchEffect(() => {
  let command = 'deck gateway apply -'

  if (props.geoApiServerUrl) {
    command += ` --konnect-addr ${props.geoApiServerUrl}`
  } else if (props.kongAdminApiUrl) {
    command += ` --kong-addr ${props.kongAdminApiUrl}`
  }

  if (shell.value === 'bash') {
    // Bash uses echo with single quotes
    deckCommand.value = `echo '
${yamlContent.value}
' | ${command}`
    // unredacted Bash command
    unredactedDeckCommand.value = `echo '
${unredactedCommand.value}
' | ${command}`
  } else {
    // PowerShell uses @' '@ for multi-line strings
    deckCommand.value = `@'
${yamlContent.value}
'@ | ${command}`
    // unredacted PowerShell command
    unredactedDeckCommand.value = `@'
${unredactedCommand.value}
'@ | ${command}`
  }
})
</script>

<style lang="scss" scoped>
.deck-config {
  .k-select {
    margin-bottom: var(--kui-space-60, $kui-space-60);
  }

  .k-code-block {
    margin-top: var(--kui-space-50, $kui-space-50);

    &.customization {
      background-color: var(--kui-color-background, $kui-color-background);
      border: 1px solid var(--kui-color-border, $kui-color-border);
      border-radius: var(--kui-border-radius-40, $kui-border-radius-40);
    }
  }

  .step-title {
    align-items: center;
    align-self: stretch;
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    gap: 16px;

    &:not(:first-child) {
      margin-top: var(--kui-space-60, $kui-space-60);
    }
  }

  .konnect-pat-actions {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-40, $kui-space-40);
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .copy-konnect-pat-alert {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .customization-footer-reminder {
    margin-top: var(--kui-space-60, $kui-space-60);
  }
}
</style>
