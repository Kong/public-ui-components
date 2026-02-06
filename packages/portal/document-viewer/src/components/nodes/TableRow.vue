<template>
  <component :is="tag">
    <tr>
      <slot />
    </tr>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { TableRowSection } from '../../types'

const props = defineProps({
  section: {
    type: String as PropType<TableRowSection>,
    default: TableRowSection.body,
  },
})

let tag: string
if (props.section === TableRowSection.header) {
  tag = 'thead'
} else if (props.section === TableRowSection.body) {
  tag = 'tbody'
} else if (props.section === TableRowSection.footer) {
  tag = 'tfoot'
}
</script>

<style scoped lang="scss">
th,
td {
  text-align: left;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

tr {
  border-top: var(--kui-border-width-10, $kui-border-width-10) solid var(--kong-ui-document-viewer-color, #000933);
}
</style>
