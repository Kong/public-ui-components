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
import { reactive } from 'vue'

const props = defineProps({
  yamlRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

const yamlContent = reactive(props.yamlRecord)
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
