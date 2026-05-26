<template>
  <div class="code-text">
    <textarea v-model="localText" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const localText = ref(props.modelValue)

// Custom debounce function
function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const debouncedEmit = debounce((newText) => {
  emit('update:modelValue', newText)
}, 100)

watch(localText, debouncedEmit)

watch(() => props.modelValue, (newValue) => {
  if (newValue !== localText.value) {
    localText.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.code-text {
  display: block;
  margin: 5px 0;
  transition: filter .3s ease-in;
  width: auto;

  &.has-error {
    filter: drop-shadow(0 0 1px crimson);
  }

  &.is-valid {
    filter: drop-shadow(0 0 1px lightgreen);
  }

  textarea {
    background-color: $kui-color-background-neutral-weakest;
    border: 1px solid $kui-color-border-primary-weaker;
    border-radius: 4px;
    color: #333333;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: $kui-font-size-20;
    height: 500px;
    line-height: 1.5;
    overflow: auto;
    padding: 5px;
    resize: vertical;
    scrollbar-color: #bbbbbb #e0e0e0;
    scrollbar-width: thin;
    -moz-tab-size: 4;
    tab-size: 4;
    width: 90%;
  }

  textarea::-webkit-scrollbar {
    width: 5px;
  }

  textarea::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 10px;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: #bbbbbb;
    border: 1px solid #aaaaaa;
    border-radius: 10px;
  }

  textarea:focus :not(.has-error),
  textarea:focus-visible :not(.has-error) {
    border-color: white;
    box-shadow: 0 0 0 2px #aaaaaa;
    outline: none;
  }
}
</style>
