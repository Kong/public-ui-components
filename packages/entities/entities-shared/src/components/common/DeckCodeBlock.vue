<template>
  <div class="deck-config config-card-code-block">
    <p>
      The <KBadge>DECK_KONNECT_TOKEN</KBadge> environment variable must be added first.
      See <a
        href="https://developer.konghq.com/deck/get-started/"
        target="_blank"
      >the documentation</a> for details.
    </p>
    <KCodeBlock
      id="deck-env-codeblock"
      code="export DECK_KONNECT_TOKEN=<your_konnect_PAT>"
      language="shell"
      single-line
      style="margin-bottom: 28px;"
      theme="dark"
    />
    <KCodeBlock
      v-if="props.entityRecord"
      id="deck-codeblock"
      :code="deckCommand"
      language="shell"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import { computed } from 'vue'
import { SupportedEntityType } from '../../types'
import type { SupportedEntityDeck } from '../../types'

const props = defineProps<{
  /** A record to indicate the entity's configuration, used to populate the decK code block */
  entityRecord: Record<string, any>
  entityType: SupportedEntityDeck
  /** e.g. https://us.api.konghq.tech, used to pass --konnect-addr parameter to decK */
  geoServerUrl?: string
  controlPlaneName?: string
}>()

const baseObject = computed(() => {
  const obj: Record<string, any> = {
    _format_version: '3.0',
  }
  if (props.controlPlaneName) {
    obj._konnect = {
      control_plane_name: props.controlPlaneName,
    }
  }
  return obj
})

const yamlContent = computed((): string => {
  // filter out null values, empty strings, and empty arrays since decK doesn't accept them [KHCP-10642]
  const filteredRecord = Object.fromEntries(Object.entries(props.entityRecord).filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length !== 0 : true)))

  // transfer parent object `{id: string}` to just id string for decK compatibility
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

  const fullRecord = {
    ...baseObject.value,
    [props.entityType + 's']: [filteredRecord],
  }

  return yaml.dump(fullRecord)
})

const deckCommand = computed((): string => {
  let command = 'deck gatway apply -'

  if (props.geoServerUrl) {
    command += ` --konnect-addr ${props.geoServerUrl}`
  }

  return `echo
'${yamlContent.value}
' | ${command}`
})

</script>
