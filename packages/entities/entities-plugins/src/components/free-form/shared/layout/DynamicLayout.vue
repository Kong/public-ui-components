<template>
  <component
    :is="layoutComponent"
    v-bind="forwardedProps"
  >
    <template
      v-for="(_, slotName) in slots"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps ?? {}"
      />
    </template>
  </component>
</template>

<script setup lang="ts" generic="T extends FreeFormPluginData">
import { computed, inject, useAttrs, useSlots } from 'vue'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import StandardLayout from './StandardLayout.vue'
import { FREE_FORM_PLUGIN_LAYOUT } from './provider'
import type { PluginFormLayoutComponent, PluginFormLayoutProps } from './provider'

defineOptions({ inheritAttrs: false })

const props = defineProps<PluginFormLayoutProps<T>>()
const attrs = useAttrs()
const slots = useSlots()

const layoutComponent = inject(
  FREE_FORM_PLUGIN_LAYOUT,
  StandardLayout as PluginFormLayoutComponent,
) as PluginFormLayoutComponent<T>

const forwardedProps = computed(() => ({
  ...attrs,
  ...props,
}))
</script>
