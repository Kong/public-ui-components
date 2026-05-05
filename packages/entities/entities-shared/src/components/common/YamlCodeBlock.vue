<template>
  <DeckCallout
    v-if="props.deckCalloutPreferenceKey && deckCalloutPreference === 'visible'"
    @click-cta="$emit('deck-callout:click-cta')"
    @dismiss="handleDeckCalloutDismiss()"
  />

  <div
    class="yaml-config config-card-code-block"
    v-bind="$attrs"
  >
    <KCodeBlock
      v-if="props.entityRecord"
      id="yaml-codeblock"
      :code="yamlContent"
      :copy-code="unredactedYamlContent"
      data-dd-privacy="mask"
      language="yaml"
      theme="dark"
      @code-block-render="highlightCodeBlock"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import { computed, ref, watch } from 'vue'

import { highlightCodeBlock } from '../../utils/code-block'
import DeckCallout from './DeckCallout.vue'

import type { PropType } from 'vue'

import type { DeckCalloutPreference } from '../../types'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /** A record to indicate the entity's configuration, the visible code content (may be redacted) */
  entityRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  /** The unredacted record, used for copy actions */
  unredactedRecord: {
    type: Object as PropType<Record<string, any>>,
    default: null,
  },
  /**
   * The localStorage key to use to persist the visibility preference for the decK format callout.
   * Omitting this will hide the callout in any case.
   */
  deckCalloutPreferenceKey: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  'deck-callout:click-cta': []
  'deck-callout:dismiss': []
}>()

const deckCalloutPreference = ref<DeckCalloutPreference>('visible')

const buildYaml = (record: Record<string, any>): string => {
  // filter out null values, empty strings, and empty arrays since decK doesn't accept them [KHCP-10642]
  const filteredRecord = Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length !== 0 : true)))
  // if empty object, display empty yaml, else convert to yaml and remove any trailing whitespace
  return (Object.keys(filteredRecord).length === 0 && filteredRecord.constructor === Object) ? '' : yaml.dump(filteredRecord).trim()
}

const yamlContent = computed((): string => {
  return buildYaml(props.entityRecord)
})

const unredactedYamlContent = computed((): string => {
  return buildYaml(props.unredactedRecord || props.entityRecord)
})

watch(() => props.deckCalloutPreferenceKey, (key) => {
  if (key) {
    const storedValue = localStorage.getItem(key)
    deckCalloutPreference.value = storedValue === 'dismissed' ? 'dismissed' : 'visible'
  }
}, { immediate: true })

watch(deckCalloutPreference, (preference) => {
  const key = props.deckCalloutPreferenceKey
  if (key) {
    localStorage.setItem(key, preference)
  }
})

function handleDeckCalloutDismiss() {
  deckCalloutPreference.value = 'dismissed'
  emit('deck-callout:dismiss')
}
</script>
