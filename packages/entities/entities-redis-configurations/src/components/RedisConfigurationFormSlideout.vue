<template>
  <KSlideout
    class="redis-create-slideout"
    :close-on-blur="false"
    data-testid="redis-create-slideout"
    max-width="800px"
    :offset-top="60"
    :title="t('list.action_with_managed_konnect')"
    :visible="visible"
    @close="emit('close')"
  >
    <RedisConfigurationForm
      v-if="visible"
      :config="realFormConfig"
      :disabled-partial-type="disabledType"
      :slidout-top-offset="60"
      @cancel="emit('close')"
      @error="onError"
      @update="onUpdated"
    />
  </KSlideout>
</template>

<script setup lang="ts">
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject } from 'vue'
import { useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { AxiosError } from 'axios'

import { PartialType, type RedisConfigurationResponse } from '../types'
import RedisConfigurationForm from './RedisConfigurationForm.vue'
import useI18n from '../composables/useI18n'

const {
  partialType = 'redis-ee',
  visible,
} = defineProps<{
  visible: boolean
  partialType?: 'redis-ce' | 'redis-ee'
}>()

const emit = defineEmits<{
  toast: [payload: { message: string, appearance: 'success' | 'danger' }]
  close: []
  created: [data: RedisConfigurationResponse]
}>()

const { i18n: { t } } = useI18n()
const { getMessageFromError } = useErrors()
const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig>(FORMS_CONFIG)!

const realFormConfig = computed(() => ({
  ...formConfig,
  cancelRoute: undefined,
  useKonnectManagedRedisUi: true,
  isCloudGateway: false,
}))

const disabledType = computed(() => {
  switch (partialType) {
    case PartialType.REDIS_CE:
      return PartialType.REDIS_EE
    case PartialType.REDIS_EE:
      return PartialType.REDIS_CE
    default:
      return undefined
  }
})

const onError = (error: AxiosError) => {
  emit('toast', {
    message: getMessageFromError(error),
    appearance: 'danger',
  })
}

const onUpdated = (data: RedisConfigurationResponse) => {
  emit('toast', {
    message: t('form.partial_created_success_message'),
    appearance: 'success',
  })
  // Emit created before close so selector can skip restoring previous selection
  emit('created', data)
  emit('close')
}
</script>

<style scoped lang="scss">
.redis-create-slideout {
  :deep(.k-card) {
    border: none;
    border-radius: var(--kui-border-radius-0, $kui-border-radius-0);
  }
}
</style>
