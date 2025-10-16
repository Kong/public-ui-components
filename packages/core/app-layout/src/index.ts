import type { App } from 'vue'

import AccountDropdown from './components/navbar/AccountDropdown.vue'
import AppAboutSection from './components/aboutSection/AppAboutSection.vue'
import AppError from './components/errors/AppError.vue'
import AppLayout from './components/AppLayout.vue'
import AppNavbar from './components/navbar/AppNavbar.vue'
import AppPageHeader from './components/pageHeader/AppPageHeader.vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import SidebarToggle from './components/sidebar/SidebarToggle.vue'
import AppPageInfoSection from './components/pageInfoSection/AppPageInfoSection.vue'
import NewBadge from './components/newBadge/NewBadge.vue'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    app.component(options.name || 'AppLayout', AppLayout)
  },
}

// Export individual Components
export {
  AccountDropdown,
  AppAboutSection,
  AppError,
  AppLayout,
  AppNavbar,
  AppPageHeader,
  AppSidebar,
  SidebarToggle,
  AppPageInfoSection,
  NewBadge,
}

export * from './types'
