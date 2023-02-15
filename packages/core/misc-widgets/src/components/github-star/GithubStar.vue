<template>
  <div
    v-if="url"
    class="kong-ui-public-misc-widgets-github-star"
    data-testid="github-star"
  >
    <a
      aria-label="i18n.t('githubStar.ariaLabel')"
      class="github-button"
      data-color-scheme="no-preference: light; light: light; dark: light;"
      data-show-count="true"
      :href="url"
      target="_blank"
    >{{ i18n.t('githubStar.title') }}</a>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import composables from '../../composables'

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
})

const { i18n } = composables.useI18n()

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
