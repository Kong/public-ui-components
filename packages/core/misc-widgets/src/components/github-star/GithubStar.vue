<template>
  <div
    v-if="url && scriptLoaded"
    class="kong-ui-public-misc-widgets-github-star"
    data-testid="github-star"
    data-tracking-id="github-star"
  >
    <KTooltip :label="tooltipLabel">
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
import { computed, onMounted, ref } from 'vue'
import composables from '../../composables'

const { i18n } = composables.useI18n()

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  tooltipText: {
    type: String,
    required: false,
    default: '',
  },
})

const tooltipLabel = computed((): string => props.tooltipText || i18n.t('githubStar.tooltipLabel'))

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
