<template>
  <CelInput :language="language">
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps ?? {}"
      />
    </template>
  </CelInput>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { CelInput } from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import type { PluginCelFieldKind } from './cel-editor'
import { getPluginFieldCelLanguage } from './cel-language'

const props = defineProps<{
  kind: PluginCelFieldKind
  getSubjects?: () => Promise<CelSubjects>
}>()

const subjects = shallowRef<CelSubjects>({})
const language = computed(() => getPluginFieldCelLanguage(props.kind, () => subjects.value))

watch(() => props.getSubjects, async (load, _, onCleanup) => {
  subjects.value = {}
  if (!load) return
  let active = true
  onCleanup(() => {
    active = false
  })
  const records = await load().catch(() => ({}))
  if (active) subjects.value = records
}, { immediate: true, flush: 'sync' })
</script>
