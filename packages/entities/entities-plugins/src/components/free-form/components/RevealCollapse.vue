<template>
  <KCollapse
    ref="collapse"
    v-model="collapsed"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps ?? {}"
      />
    </template>
  </KCollapse>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KCollapse } from '@kong/kongponents'
import { useRevealOpen } from '@kong-ui-public/freeform'

/**
 * A `KCollapse` that opens when the form reveals a field inside it.
 * Must be rendered inside a free-form `Form`.
 */

const collapsed = defineModel<boolean>({ default: true })

const collapse = useTemplateRef<InstanceType<typeof KCollapse>>('collapse')

useRevealOpen(() => collapse.value?.$el as Element | undefined, () => {
  collapsed.value = false
})
</script>
