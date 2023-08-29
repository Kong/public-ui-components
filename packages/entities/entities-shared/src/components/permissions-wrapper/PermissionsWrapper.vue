<template>
  <template v-if="showSlotContent">
    <slot
      :is-allowed="isAllowed"
      name="default"
    />
  </template>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, computed, onBeforeMount, watch } from 'vue'

const props = defineProps({
  /**
   * Provide an async function that returns a boolean to determine whether
   * the wrapper should hide or show the default slot content.
  */
  authFunction: {
    type: Function as PropType<() => (boolean | Promise<boolean>)>,
    required: true,
    default: async () => true,
  },
  /**
   * Should the default slot content be shown once the authFunction is evaluated no matter what?
   * e.g. if you want to display the item but disable it.
   */
  forceShow: {
    type: Boolean,
    default: false,
  },
})

const isAllowed = ref<boolean | undefined>(undefined)
const showSlotContent = computed((): boolean => isAllowed.value === true || (isAllowed.value !== undefined && props.forceShow === true))

watch(() => props.authFunction, async () => {
  isAllowed.value = await props.authFunction()
}, { immediate: true })
</script>
