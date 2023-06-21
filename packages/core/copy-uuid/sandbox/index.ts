import { createApp } from 'vue'
import App from './App.vue'
import CopyUuid, { CopyUuidNotifyParam } from '../src'
import { KClipboardProvider, KIcon, KTooltip } from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)

app.component('KClipboardProvider', KClipboardProvider)
app.component('KIcon', KIcon)
app.component('KTooltip', KTooltip)

app.use(CopyUuid, {
  notify: (props: CopyUuidNotifyParam) => {
    alert(props.message)
  },
})
app.mount('#app')
