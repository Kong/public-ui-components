import { ref } from 'vue'

// Module-level (not created inside the composable) so the switches rendered in the
// sandbox layout's controls panel and the page that reads them share one state.
const newAppearance = ref<boolean>(true)
const showTabs = ref<boolean>(true)
const showKaiButton = ref<boolean>(true)
const showTitleAfter = ref<boolean>(false)

export function useSandboxControls() {
  return { newAppearance, showTabs, showKaiButton, showTitleAfter }
}
