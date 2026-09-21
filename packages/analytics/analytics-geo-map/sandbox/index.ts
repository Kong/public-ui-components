import { createApp } from 'vue'
import { setWorkerUrl } from 'maplibre-gl'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import '@kong/design-tokens/themes/classic-day.css'
import '@kong/design-tokens/themes/classic-night.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(maplibreWorkerUrl)

const app = createApp(App)

app.use(Kongponents)

app.mount('#app')
