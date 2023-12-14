<template>
  <div class="yaml-config">
    <KCodeBlock
      v-if="props.yamlRecord"
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
import { onMounted, ref } from 'vue'

const jsonContent = ref('')

const props = defineProps({
  yamlRecord: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

onMounted(() => {
  jsonContent.value = JSON.stringify(props.yamlRecord, null, 2)
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
