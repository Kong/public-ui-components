<template>
  <PluginFormWrapper
    v-slot="configFormProps"
    v-bind="props"
  >
    <ConfigForm v-bind="configFormProps" />
  </PluginFormWrapper>
</template>

<script setup lang="ts">
import ConfigForm from './ConfigForm.vue'
import PluginFormWrapper from '../shared/PluginFormWrapper.vue'

import type { PluginFormWrapperProps } from '../shared/PluginFormWrapper.vue'

const props = defineProps<PluginFormWrapperProps<any>>()
</script>
