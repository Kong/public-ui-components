import { defineConfig } from 'cypress'
import viteConfig from './vite.config'
import baseConfig from '../../../cypress.config'

const config = defineConfig({
  ...baseConfig,
  component: {
    ...baseConfig.component,
    devServer: {
      ...baseConfig.component!.devServer,
      viteConfig, // fixme: type error
    } as any,
  },
})

console.log('config', config)

export default config
