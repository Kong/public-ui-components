<template>
  <div class="yaml-config">
    <KCodeBlock
      id="yaml-codeblock"
      :code="yaml.dump(props.yamlRecord)"
      language="yaml"
      theme="dark"
    />
  </div>
</template>

<script setup lang="ts">
import yaml from 'js-yaml'
import type { PropType } from 'vue'

const props = defineProps({
  yamlRecord: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
})
</script>

<style lang="scss">
.yaml-config {
  #yaml-codeblock {
    .k-highlighted-code-block {
      code {
        background-color: $kui-color-background-neutral-strongest;
      }
    }
  }
}
</style>
