import { ref, watch } from 'vue'

// Module-level (not created inside the composable) so the switches rendered in the
// sandbox layout's controls panel and the page that reads them share one state.
const newAppearance = ref<boolean>(true)
const showTabs = ref<boolean>(true)
const showAnchorNavigation = ref<boolean>(false)
const showFavoriteButton = ref<boolean>(true)
const showTitleAfter = ref<boolean>(false)
const showAside = ref<boolean>(true)
const showAskKaiButton = ref<boolean>(true)
const aboutCardIsLoading = ref<boolean>(false)

// PageLayout shows tabs or anchor navigation, never both, so the switches mirror that: turning
// one on turns the other off instead of leaving a combination the component cannot render.
watch(showTabs, (on) => {
  if (on) {
    showAnchorNavigation.value = false
  }
})

watch(showAnchorNavigation, (on) => {
  if (on) {
    showTabs.value = false
  }
})

export function useSandboxControls() {
  return { newAppearance, showTabs, showAnchorNavigation, showFavoriteButton, showTitleAfter, showAside, showAskKaiButton, aboutCardIsLoading }
}
