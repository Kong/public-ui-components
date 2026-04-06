<template>
  <SlideTransition>
    <RedisSelector
      v-if="formData.config?.strategy === 'redis'"
      :is-konnect-managed-redis-enabled="isKonnectManagedRedisEnabled"
    />
  </SlideTransition>
</template>

<script setup lang="ts">
import { computed, inject, watchEffect } from 'vue'

import { FORMS_CONFIG } from '@kong-ui-public/forms'
import RedisSelector from '../shared/RedisSelector.vue'
import { useFormShared } from '../shared/composables'
import SlideTransition from '../shared/SlideTransition.vue'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../../types'
import { REDIS_PARTIAL_INFO } from '../shared/const'

const { formData } = useFormShared<FreeFormPluginData>()

// RedisField isn’t given isKonnectManagedRedisEnabled by parents; read plugin config via FORMS_CONFIG (same provide as PluginEntityForm)
const pluginFormConfig = inject(FORMS_CONFIG) as KonnectPluginFormConfig | KongManagerPluginFormConfig | undefined

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)
const isFormEditing = redisPartialInfo?.isEditing || false

const isKonnectManagedRedisEnabled = computed(() => {
  if (pluginFormConfig?.app !== 'konnect') return false
  const konnect = pluginFormConfig as KonnectPluginFormConfig
  return !!konnect.isKonnectManagedRedisEnabled && konnect.isCloudGateway === true
})

watchEffect(() => {
  if (formData.config) {
    // reset partials if strategy not redis
    if (formData.config.strategy !== 'redis') {
      formData.partials = isFormEditing ? null : undefined
    }
  }
})
</script>
