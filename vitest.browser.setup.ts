import { afterEach } from 'vitest'
import { config, enableAutoUnmount } from '@vue/test-utils'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

config.global.plugins = [Kongponents]
config.global.stubs = { transition: false, RouterLink: true }
enableAutoUnmount(afterEach)
