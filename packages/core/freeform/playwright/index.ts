import '@kong/kongponents/dist/style.css'
import Kongponents from '@kong/kongponents'
import { beforeMount } from '@playwright/experimental-ct-vue/hooks'

beforeMount(async ({ app }) => {
  app.use(Kongponents)
})
