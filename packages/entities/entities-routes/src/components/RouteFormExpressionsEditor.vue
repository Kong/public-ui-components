<template>
  <ExpressionsEditor
    v-if="schema !== undefined"
    v-model="expression"
    :schema="schema"
  />

  <div
    class="route-form-open-in-playground"
    data-testid="open-router-playground"
    @click="isPlaygroundVisible = true"
  >
    <RocketIcon size="16px" />
    <span>{{ playgroundTriggerText }}</span>
  </div>

  <RouterPlaygroundModal
    v-if="isPlaygroundVisible"
    :initial-expression="expression"
    :is-visible="isPlaygroundVisible"
    @cancel="isPlaygroundVisible = false"
    @commit="handleCommit"
    @notify="handleNotify"
  />
</template>

<script setup lang="ts">
/**
 * This component assumes that @kong-ui-public/expressions has been initialized.
 */
import { ExpressionsEditor, PROTOCOL_TO_SCHEMA, type Schema, RouterPlaygroundModal } from '@kong-ui-public/expressions'
import { computed, ref } from 'vue'
import { RocketIcon } from '@kong/icons'

import '@kong-ui-public/expressions/dist/style.css'

const props = defineProps<{ protocol?: string, playgroundTriggerText: string }>()
const expression = defineModel<string>({ required: true })
const emit = defineEmits<{
  (e: 'notify', options: { message: string, type: string }): void
}>()
const isPlaygroundVisible = ref(false)

const schema = computed<Schema | undefined>(() => {
  return PROTOCOL_TO_SCHEMA[props.protocol as keyof typeof PROTOCOL_TO_SCHEMA]
})

const handleCommit = (expr: string) => {
  expression.value = expr
  isPlaygroundVisible.value = false
}

const handleNotify = (options: {
  message: string;
  type: string;
}) => {
  emit('notify', options)
}
</script>

<style scoped lang="scss">
.route-form-open-in-playground {
  align-items: center;
  color: $kui-color-text-primary-strong;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-size: $kui-font-size-30;
  font-weight: bold;
  gap: $kui-space-40;
  justify-content: flex-start;
  margin-top: $kui-space-50;
}
</style>
