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

<style scoped>
th, td {
  padding: 8px;
  vertical-align: top;
  text-align: left;
}

th:not(:last-of-type), td:not(:last-of-type) {
  border-right: 1px solid var(--document-viewer-color, var(--text_colors-primary, #0b172d));
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}
</style>
