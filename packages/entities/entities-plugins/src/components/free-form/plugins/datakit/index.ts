import DatakitForm from './DatakitForm.vue'
import { definePluginConfig } from '../../define-plugin-config'

export default definePluginConfig({
  component: DatakitForm,
  // Datakit keeps one error message: its nodes are edited in the flow editor, not as fields
  fieldErrors: false,
})
