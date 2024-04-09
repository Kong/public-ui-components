<template>
  <ExpressionsEditor
    v-if="schema !== undefined"
    v-model="expression"
    :schema="schema"
  />
</template>

<script setup lang="ts">
/**
 * This component assumes that @kong-ui-public/expressions has been initialized.
 */
import { ExpressionsEditor, PROTOCOL_TO_SCHEMA, type Schema } from '@kong-ui-public/expressions'
import { computed } from 'vue'

import '@kong-ui-public/expressions/dist/style.css'

const props = defineProps<{ protocol?: string }>()
const expression = defineModel<string>({ required: true })

const schema = computed<Schema | undefined>(() => {
  return PROTOCOL_TO_SCHEMA[props.protocol as keyof typeof PROTOCOL_TO_SCHEMA]
})
</script>
