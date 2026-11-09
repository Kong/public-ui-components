<template>
  <div
    class="code-text"
    :class="{
      'has-error': hasError,
      'is-valid': isValid,
    }"
  >
    <textarea v-model="localText" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { watchDebounced } from '@vueuse/core'

function isValidJson(str: string): boolean {
  if (!str) return true

  try {
    JSON.parse(str)
  } catch {
    return false
  }

  return true
}


const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const localText = ref(props.modelValue)

const isValid = computed(() => props.modelValue !== undefined &&
  props.modelValue !== '' &&
  isValidJson(props.modelValue))
const hasError = computed(() => !isValidJson(props.modelValue))

watchDebounced(localText, (newValue) => {
  emit('update:modelValue', newValue)
}, { debounce: 300 })

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localText.value) {
    localText.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.code-text {
  display: block;
  margin: var(--kui-space-20, $kui-space-20) 0;
  transition: filter var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
  width: auto;

  &.has-error {
    filter: drop-shadow(0 0 1px var(--kui-color-border-danger, $kui-color-border-danger));
  }

  &.is-valid {
    filter: drop-shadow(0 0 1px var(--kui-color-text-success, $kui-color-text-success));
  }

  textarea {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text, $kui-color-text);
    font-family: var(--kui-font-family-code, $kui-font-family-code);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    height: 500px;
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    overflow: auto;
    padding: var(--kui-space-20, $kui-space-20);
    resize: vertical;
    scrollbar-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak) transparent;
    scrollbar-width: thin;
    -moz-tab-size: 4;
    tab-size: 4;
    width: 90%;
  }

  textarea:focus {
    border-color: var(--kui-color-border-primary, $kui-color-border-primary);
    box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
    outline: none;
  }
}
</style>
