import CustomPluginForm from './components/CustomPluginForm.vue'
import PluginForm from './components/PluginForm.vue'
import PluginList from './components/PluginList.vue'
import PluginSelect from './components/PluginSelect.vue'
import PluginCatalog from './components/PluginCatalog.vue'
import PluginSelectGrid from './components/select/PluginSelectGrid.vue'
import PluginSelectCard from './components/select/PluginSelectCard.vue'
import PluginConfigCard from './components/PluginConfigCard.vue'
import DynamicLayout from './components/free-form/shared/layout/DynamicLayout.vue'
import PluginConfigurationForm from './components/free-form/shared/layout/PluginConfigurationForm.vue'
import composables from './composables'
import pluginEndpoints from './plugins-endpoints'

const { usePluginMetaData, useProvideExperimentalFreeForms } = composables

export {
  CustomPluginForm,
  PluginForm,
  PluginList,
  PluginSelect,
  PluginCatalog,
  PluginSelectGrid,
  PluginSelectCard,
  PluginConfigCard,
  DynamicLayout,
  PluginConfigurationForm,
  usePluginMetaData,
  useProvideExperimentalFreeForms,
}

export {
  useProvideFreeFormPluginLayout,
} from './components/free-form/shared/layout/provider'

export type {
  PluginConfigurationBaseProps,
  PluginFormLayoutComponent,
  PluginFormLayoutProps,
} from './components/free-form/shared/layout/provider'

export * from './types'

export { pluginEndpoints }

export * from './constants'

/**
 * @deprecated
 * Please import PluginIcon and getPluginIconURL from '@kong-ui-public/entities-plugins-icon' directly.
 */
export { getPluginIconURL, PluginIcon } from '@kong-ui-public/entities-plugins-icon'
