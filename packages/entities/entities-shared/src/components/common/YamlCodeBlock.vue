<template>
  <div class="yaml-config config-card-code-block">
    <KCodeBlock
      v-if="props.entityRecord"
      id="yaml-codeblock"
      :code="yamlContent"
      language="yaml"
      theme="dark"
      @code-block-render="highlightCodeBlock"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { highlightCodeBlock } from '../../utils/code-block'

const props = defineProps({
  /** A record to indicate the entity's configuration, used to populate the YAML code block */
  entityRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

const yamlContent = computed((): string => {
  // filter out null values, empty strings, and empty arrays since decK doesn't accept them [KHCP-10642]
  const filteredRecord = Object.fromEntries(Object.entries(props.entityRecord).filter(([, value]) => value !== null && value !== '' && (Array.isArray(value) ? value.length !== 0 : true)))
  // if empty object, display empty yaml, else convert to yaml and remove any trailing whitespace
  return (Object.keys(filteredRecord).length === 0 && filteredRecord.constructor === Object) ? '' : yaml.dump(filteredRecord).trim()
})
</script>
