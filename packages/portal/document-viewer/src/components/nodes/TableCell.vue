<template>
  <component
    :is="tag"
    :class="className"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { TableCellAlign, TableRowNode, TableRowSection } from '../../types'

const props = defineProps({
  align: {
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
if (props.align === TableCellAlign.center) {
  className = 'align-center'
} else if (props.align === TableCellAlign.right) {
  className = 'align-right'
}
</script>

<style scoped>
th, td {
  text-align: left;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}
</style>
