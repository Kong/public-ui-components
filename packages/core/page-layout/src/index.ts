import PageLayout from './components/PageLayout.vue'
// Exported only so a host whose architecture prevents it from passing the `tabs` prop down
// to its PageLayout can render the tab bar itself and slot it back in (see the `tabs` slot
// on PageLayout). Not meant to be used apart from PageLayout.
import PageLayoutTabs from './components/PageLayoutTabs.vue'
import AboutCard from './components/AboutCard.vue'

export { PageLayout, PageLayoutTabs, AboutCard }

export { NEW_APPEARANCE_INJECTION_KEY } from './symbols'

export * from './types'
