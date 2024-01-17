<template>
  <div class="yaml-config">
    <KCodeBlock
      v-if="props.yamlRecord"
      id="yaml-codeblock"
      :code="yaml.dump(yamlContent)"
      language="yaml"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import type { PropType } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  /** A record to indicate the entity's configuration, used to populate the YAML code block */
  yamlRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

const yamlContent = computed((): Record<string, any> => props.yamlRecord)
</script>

<style lang="scss">
.yaml-config {
  #yaml-codeblock {
    .k-highlighted-code-block {
      code {
        background-color: $kui-color-background-neutral-strongest;
      }
    }
    .k-code-block-secondary-actions {
      top: 12px !important;
    }
  }
}
</style>
