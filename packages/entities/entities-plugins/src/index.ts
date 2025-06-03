import PluginForm from './components/PluginForm.vue'
import PluginList from './components/PluginList.vue'
import PluginSelect from './components/PluginSelect.vue'
import PluginSelectGrid from './components/select/PluginSelectGrid.vue'
import PluginSelectCard from './components/select/PluginSelectCard.vue'
import PluginConfigCard from './components/PluginConfigCard.vue'
import composables from './composables'
import pluginEndpoints from './plugins-endpoints'

// expose VueFormGenerator so host app doesn't need @kong-ui-public/forms as a dependency
export { VueFormGenerator } from '@kong-ui-public/forms'

const { usePluginMetaData, useProvideExperimentalFreeForms } = composables

export {
  PluginForm,
  PluginList,
  PluginSelect,
  PluginSelectGrid,
  PluginSelectCard,
  PluginConfigCard,
  usePluginMetaData,
  useProvideExperimentalFreeForms,
}

export * from './types'

export { pluginEndpoints }

export * from './constants'

/**
 * @deprecated
 * Please import PluginIcon and getPluginIconURL from '@kong-ui-public/entities-plugins-icon' directly.
 */
export { getPluginIconURL, PluginIcon } from '@kong-ui-public/entities-plugins-icon'
