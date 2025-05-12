<template>
  <ExpressionsEditor
    v-if="schema !== undefined"
    v-model="expression"
    :schema="schema"
  />

  <KTooltip
    placement="bottom-start"
    :text="tooltipText"
  >
    <div
      v-if="showExpressionsModalEntry"
      :class="{ disabled: !isHttpBasedProtocol, 'route-form-open-in-playground': true }"
      data-testid="open-router-playground"
      @click="handleOpenPlayground"
    >
      <slot />
    </div>
  </KTooltip>

  <RouterPlaygroundModal
    v-if="showExpressionsModalEntry && isHttpBasedProtocol"
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
import { ExpressionsEditor, HTTP_BASED_PROTOCOLS, PROTOCOL_TO_SCHEMA, RouterPlaygroundModal, type Schema } from '@kong-ui-public/expressions'
import { computed, ref } from 'vue'
import composables from '../composables'

import '@kong-ui-public/expressions/dist/style.css'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  protocol?: string
  showExpressionsModalEntry?: boolean
}>()
const expression = defineModel<string>({ required: true })
const emit = defineEmits<{
  (e: 'notify', options: { message: string, type: string }): void
}>()
const isPlaygroundVisible = ref(false)

const schema = computed<Schema | undefined>(() => {
  return PROTOCOL_TO_SCHEMA[props.protocol as keyof typeof PROTOCOL_TO_SCHEMA]
})

/**
 * todo: currently, only HTTP-based protocols are supported.
 * it should be removed when we support stream-based protocols in <RequestModal /> component.
 * see: KM-349
 */
const isHttpBasedProtocol = computed(() => {
  return HTTP_BASED_PROTOCOLS.includes(props.protocol ?? '')
})

const tooltipText = computed(() => {
  if (!props.showExpressionsModalEntry || isHttpBasedProtocol.value) {
    return undefined
  }

  return t('form.expression_playground.supported_protocols_hint', { protocols: HTTP_BASED_PROTOCOLS.join(', ') })
})

const handleCommit = (expr: string) => {
  expression.value = expr
  isPlaygroundVisible.value = false
}

const handleNotify = (options: {
  message: string
  type: string
}) => {
  emit('notify', options)
}

const handleOpenPlayground = () => {
  if (!isHttpBasedProtocol.value) {
    return
  }
  isPlaygroundVisible.value = true
}
</script>
