<template>
  <component
    :is="tag"
    :class="className"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { TableRowNode } from '../../types'
import { TableCellAlign, TableRowSection } from '../../types'

const props = defineProps({
  alignment: {
    type: String as PropType<TableCellAlign>,
    default: TableCellAlign.left,
  },
  parent: {
    type: Object as PropType<TableRowNode>,
    required: true,
  },
})

const tag = props.parent?.section === TableRowSection.header ? 'th' : 'td'

let className: string
if (props.alignment === TableCellAlign.center) {
  className = 'align-center'
} else if (props.alignment === TableCellAlign.right) {
  className = 'align-right'
}
</script>

<style scoped lang="scss">
th, td {
  padding: var(--kui-space-40, $kui-space-40);
  text-align: left;
  vertical-align: top;

  :deep(code) {
    line-height: var(--kui-line-height-40, $kui-line-height-40);
  }
}

th:not(:last-of-type), td:not(:last-of-type) {
  border-right: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}
</style>
