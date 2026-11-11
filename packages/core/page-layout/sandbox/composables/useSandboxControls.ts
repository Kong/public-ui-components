import { ref, watch } from 'vue'

// Module-level (not created inside the composable) so the switches rendered in the
// sandbox layout's controls panel and the page that reads them share one state.
const newAppearance = ref<boolean>(true)
const showEmptyState = ref<boolean>(false)
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

// The empty state is a chromeless page shape: with no title and no breadcrumbs PageLayout
// omits the header except for its actions area. The toggles that feed the omitted parts
// are turned off alongside it, so the demo starts from the state the component expects.
watch(showEmptyState, (on) => {
  if (on) {
    showTabs.value = false
    showAnchorNavigation.value = false
    showFavoriteButton.value = false
    showTitleAfter.value = false
    showAside.value = false
  }
})

export function useSandboxControls() {
  return { newAppearance, showEmptyState, showTabs, showAnchorNavigation, showFavoriteButton, showTitleAfter, showAside, showAskKaiButton, aboutCardIsLoading }
}
