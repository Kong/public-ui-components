<template>
  <div class="deck-config config-card-code-block">
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
    <p>
      <i18nT :keypath="`deckCodeBlock.hint.${app}`">
        <template #token>
          <KBadge>DECK_KONNECT_TOKEN</KBadge>
        </template>
        <template #link>
          <KExternalLink :href="app === 'konnect' ? 'https://developer.konghq.com/deck/get-started/' : 'https://developer.konghq.com/deck/gateway/configuration/'">
            {{ i18n.t('deckCodeBlock.documentation') }}
          </KExternalLink>
        </template>
      </i18nT>
    </p>
    <KCodeBlock
      v-if="app === 'konnect'"
      id="deck-env-codeblock"
      :code="envCommand"
      :language="shell"
      single-line
      theme="dark"
      @code-block-render="highlightCodeBlock"
    />
    <KCodeBlock
      v-if="props.entityRecord"
      id="deck-codeblock"
      :code="deckCommand"
      :language="shell"
      theme="dark"
      @code-block-render="highlightCodeBlock"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import { computed, ref } from 'vue'
import { KExternalLink } from '@kong/kongponents'
import { LanguageShellIcon, LanguageBashIcon } from '@kong/icons'
import { highlightCodeBlock } from '../../utils/code-block'
import composables from '../../composables'
import { SupportedEntityType } from '../../types'
import type { SupportedEntityDeck } from '../../types'

const props = defineProps<{
  app: 'konnect' | 'kongManager'
  /** A record to indicate the entity's configuration, used to populate the decK code block */
  entityRecord: Record<string, any>
  entityType: SupportedEntityDeck
  /** e.g. https://us.api.konghq.tech, used to pass --konnect-addr parameter to decK */
  geoApiServerUrl?: string
  controlPlaneName?: string
  /** e.g. https://localhost:8001, used to pass --kong-addr parameter to decK */
  kongAdminApiUrl?: string
  workspace?: string
}>()

const { i18n, i18nT } = composables.useI18n()

const shells = [
  { value: 'bash', label: 'Linux / macOS Bash' },
  { value: 'powershell', label: 'Windows PowerShell' },
]

const shell = ref((() => {
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

const yamlContent = computed((): string => {
  // filter out null values, empty strings, and empty arrays since decK doesn't accept them [KHCP-10642]
  const filteredRecord = Object.fromEntries(Object.entries(props.entityRecord).filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length !== 0 : true)))

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
})

const envCommand = computed((): string => {
  if (shell.value === 'bash') {
    return 'export DECK_KONNECT_TOKEN=\'YOUR_KONNECT_PAT\''
  } else {
    return '$env:DECK_KONNECT_TOKEN = "YOUR_KONNECT_PAT"'
  }
})

const deckCommand = computed((): string => {
  let command = 'deck gateway apply -'

  if (props.geoApiServerUrl) {
    command += ` --konnect-addr ${props.geoApiServerUrl}`
  } else if (props.kongAdminApiUrl) {
    command += ` --kong-addr ${props.kongAdminApiUrl}`
  }

  if (shell.value === 'bash') {
    // Bash uses echo with single quotes
    return `echo '
${yamlContent.value}
' | ${command}`
  } else {
    // PowerShell uses @' '@ for multi-line strings
    return `@'
${yamlContent.value}
'@ | ${command}`
  }
})

</script>

<style lang="scss" scoped>
.deck-config {
  .k-select {
    margin-bottom: $kui-space-60;
  }

  .k-code-block {
    margin-top: $kui-space-50;
  }
}
</style>
