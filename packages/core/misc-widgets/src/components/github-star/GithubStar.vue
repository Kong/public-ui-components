<template>
  <div
    class="kong-ui-public-misc-widgets-github-star"
    data-testid="github-star"
  >
    <a
      aria-label="Star buttons/github-buttons on GitHub"
      class="github-button"
      data-color-scheme="no-preference: light; light: light; dark: light;"
      data-show-count="true"
      :href="url"
    >Star</a>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const props = defineProps({
  url: {
    type: String,
    required: true,
    default: '',
  },
})

const url = computed(() => props.url)

onMounted(async () => {
  const githubStarScript = document.createElement('script')
  githubStarScript.setAttribute('src', 'https://buttons.github.io/buttons.js')
  document.head.appendChild(githubStarScript)
})
</script>

<style lang="scss" scoped>
.kong-ui-public-misc-widgets-github-star {
  // Add component styles as needed
}
</style>
