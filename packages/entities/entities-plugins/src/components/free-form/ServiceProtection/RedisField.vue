<template>
  <SlideTransition>
    <RedisSelector
      v-if="formData.config?.strategy === 'redis'"
    />
  </SlideTransition>
</template>

<script setup lang="ts">
import { inject, watchEffect } from 'vue'

import RedisSelector from '../shared/RedisSelector.vue'
import { useFormShared } from '../shared/composables'
import SlideTransition from '../shared/SlideTransition.vue'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import { REDIS_PARTIAL_INFO } from '../shared/const'

const { formData } = useFormShared<FreeFormPluginData>()

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)
const isFormEditing = redisPartialInfo?.isEditing || false

watchEffect(() => {
  if (formData.config) {
    // reset partials if strategy not redis
    if (formData.config.strategy !== 'redis') {
      formData.partials = isFormEditing ? null : undefined
    }
  }
})
</script>
