import PluginForm from './components/PluginForm.vue'
import PluginIcon from './components/PluginIcon.vue'
import PluginList from './components/PluginList.vue'
import PluginSelect from './components/PluginSelect.vue'
import PluginSelectGrid from './components/select/PluginSelectGrid.vue'
import PluginSelectCard from './components/select/PluginSelectCard.vue'
import PluginConfigCard from './components/PluginConfigCard.vue'
import composables from './composables'
import { getPluginIconURL } from './definitions/metadata'
import pluginEndpoints from './plugins-endpoints'

// expose VueFormGenerator so host app doesn't need @kong-ui-public/forms as a dependency
export { VueFormGenerator } from '@kong-ui-public/forms'

const { usePluginMetaData } = composables

export {
  PluginForm,
  PluginIcon,
  PluginList,
  PluginSelect,
  PluginSelectGrid,
  PluginSelectCard,
  PluginConfigCard,
  getPluginIconURL,
  usePluginMetaData,
}

export * from './types'

export { pluginEndpoints }
