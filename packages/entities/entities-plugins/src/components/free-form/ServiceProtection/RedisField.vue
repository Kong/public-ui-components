<template>
  <SlideTransition>
    <RedisSelector
      v-if="formData.config?.strategy === 'redis'"
    />
  </SlideTransition>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'

import RedisSelector from '../shared/RedisSelector.vue'
import { useFormShared } from '../shared/composables'
import SlideTransition from '../shared/SlideTransition.vue'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'

const { formData } = useFormShared<FreeFormPluginData>()

watchEffect(() => {
  if (formData.config) {
    // reset partials if strategy not redis
    if (formData.config.strategy !== 'redis') {
      formData.partials = undefined
    }
  }
})
</script>
