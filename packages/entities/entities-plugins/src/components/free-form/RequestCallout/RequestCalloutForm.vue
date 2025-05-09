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

import type { Props } from '../shared/PluginFormWrapper.vue'
import type { RequestCalloutPlugin } from './types'

const props = defineProps<Props<RequestCalloutPlugin>>()
</script>
