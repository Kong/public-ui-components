<template>
  <div
    v-if="open"
    class="redis-inline-create"
    data-testid="redis-inline-create"
  >
    <header class="redis-inline-create-header">
      <h3 class="redis-inline-create-title">
        {{ t('list.action_with_managed_konnect') }}
      </h3>
      <KButton
        appearance="tertiary"
        data-testid="redis-inline-create-close"
        icon
        @click="close"
      >
        <CloseIcon :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`" />
      </KButton>
    </header>

    <RedisConfigurationForm
      :action-teleport-target="footerTarget"
      :config="formConfig"
      :disabled-partial-type="partialType === PartialType.REDIS_CE ? PartialType.REDIS_EE : PartialType.REDIS_CE"
      inline
      :slidout-top-offset="0"
      @cancel="close"
      @error="onError"
      @update="onUpdated"
    />

    <div
      :id="footerId"
      class="redis-inline-create-footer"
    />
  </div>
</template>

<script setup lang="ts">
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { inject, useId } from 'vue'
import { CloseIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

import { type RedisConfigurationResponse, PartialType } from '../types'
import RedisConfigurationForm from './RedisConfigurationForm.vue'
import useI18n from '../composables/useI18n'

import type { AxiosError } from 'axios'

const {
  partialType = 'redis-ee',
  open = false,
} = defineProps<{
  open?: boolean
  partialType?: 'redis-ce' | 'redis-ee'
}>()

const emit = defineEmits<{
  'close': []
  'created': [data: RedisConfigurationResponse]
  'toast': [payload: { message: string, appearance: 'success' | 'danger' }]
}>()

const { i18n: { t } } = useI18n()
const { getMessageFromError } = useErrors()
const parentConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig>(FORMS_CONFIG)!
const footerId = useId()
const footerTarget = `#${footerId}`

const formConfig = {
  ...parentConfig,
  cancelRoute: undefined,
}

const close = () => {
  emit('close')
}

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
  close()
  emit('created', data)
}
</script>

<style scoped lang="scss">
.redis-inline-create {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  margin-top: var(--kui-space-60, $kui-space-60);
  padding: var(--kui-space-70, $kui-space-70) var(--kui-space-80, $kui-space-80);
}

.redis-inline-create-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--kui-space-60, $kui-space-60);
}

.redis-inline-create-title {
  font-size: var(--kui-font-size-50, $kui-font-size-50);
  font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  line-height: var(--kui-line-height-40, $kui-line-height-40);
  margin: var(--kui-space-0, $kui-space-0);
}

.redis-inline-create-footer {
  :deep(.form-actions) {
    justify-content: flex-start;
    margin: var(--kui-space-0, $kui-space-0);
  }
}
</style>
