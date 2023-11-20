import PluginForm from './components/PluginForm.vue'
import PluginIcon from './components/PluginIcon.vue'
import PluginList from './components/PluginList.vue'
import PluginSelect from './components/PluginSelect.vue'
import PluginSelectGrid from './components/select/PluginSelectGrid.vue'
import PluginConfigCard from './components/PluginConfigCard.vue'
import composables from './composables'

// expose VueFormGenerator so host app doesn't need @kong-ui-public/forms as a dependency
export { VueFormGenerator } from '@kong-ui-public/forms'

const { getPluginIconURL, usePluginMetaData } = composables

export {
  PluginForm,
  PluginIcon,
  PluginList,
  PluginSelect,
  PluginSelectGrid,
  PluginConfigCard,
  getPluginIconURL,
  usePluginMetaData,
}

export * from './types'
