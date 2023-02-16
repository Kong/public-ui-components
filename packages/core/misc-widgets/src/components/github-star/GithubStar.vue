<template>
  <div
    v-if="url && scriptLoaded"
    class="kong-ui-public-misc-widgets-github-star"
    data-testid="github-star"
  >
    <KTooltip :label="tooltipText">
      <span>
        <a
          :aria-label="i18n.t('githubStar.ariaLabel')"
          class="github-button"
          data-color-scheme="no-preference: light; light: light; dark: light;"
          data-show-count="true"
          :href="url"
          target="_blank"
        >
          {{ i18n.t('githubStar.title') }}
        </a>
      </span>
    </KTooltip>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import composables from '../../composables'
import { KTooltip } from '@kong/kongponents'

const { i18n } = composables.useI18n()

defineProps({
  url: {
    type: String,
    required: true,
  },
  tooltipText: {
    type: String,
    required: false,
    default: 'Star this repository on Github',
  },
})

const scriptLoaded = ref<boolean>(false)

onMounted(async () => {
  const githubStarScript = document.createElement('script')

  githubStarScript.addEventListener('load', () => {
    scriptLoaded.value = true
  })

  githubStarScript.setAttribute('src', 'https://buttons.github.io/buttons.js')
  document.head.appendChild(githubStarScript)
})
</script>

<style lang="scss" scoped>
.kong-ui-public-misc-widgets-github-star {
  .github-button {
    font-style: normal;
  }
}
</style>
