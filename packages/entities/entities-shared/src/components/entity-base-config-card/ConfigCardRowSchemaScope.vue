<template>
  <slot />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PropType } from 'vue'
import type { RecordItem } from '../../types'
import composables from '../../composables'
import { CONFIG_CARD_ROW_SCHEMA } from './row-schema'

const props = defineProps({
  item: {
    type: Object as PropType<RecordItem>,
    required: true,
  },
})

// Rows the View did not build, e.g. in a ConfigCardDisplay used on its own or nested in a View's
// slot, keep the schema provided above them.
const resolveSchema = inject(CONFIG_CARD_ROW_SCHEMA, undefined)
if (resolveSchema) {
  const inheritedSchema = composables.useSchema()
  composables.useSchemaProvider(computed(() => {
    const resolved = resolveSchema(props.item)
    return resolved ? resolved.schema : inheritedSchema?.value
  }))
}
</script>
