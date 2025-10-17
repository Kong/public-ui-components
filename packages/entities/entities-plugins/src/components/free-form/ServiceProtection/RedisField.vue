<template>
  <SlideTransition>
    <RedisSelector
      v-if="formData.config?.strategy === 'redis'"
      @global-action="(...args) => $emit('globalAction', ...args)"
    />
  </SlideTransition>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'

import RedisSelector from '../shared/RedisSelector.vue'
import { useFreeformStore } from '../shared/composables'
import SlideTransition from '../shared/SlideTransition.vue'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import type { GlobalAction } from '../shared/types'

const { formData } = useFreeformStore<FreeFormPluginData>()

defineEmits<{
  globalAction: [name: GlobalAction, payload: any]
}>()

watchEffect(() => {
  if (formData.config) {
    // reset partials if strategy not redis
    if (formData.config.strategy !== 'redis') {
      formData.partials = undefined
    }
  }
})
</script>
