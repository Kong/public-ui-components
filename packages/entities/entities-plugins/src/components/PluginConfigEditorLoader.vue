<template>
  <Suspense>
    <PluginConfigEditor v-bind="props" />

    <template #fallback>
      <KSkeletonBox
        v-for="i in 12"
        :key="i"
        height="2"
        width="100"
      />
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import PluginConfigEditor, { type PluginConfigEditorProps } from './PluginConfigEditor.vue'

const props = defineProps<PluginConfigEditorProps>()
</script>
