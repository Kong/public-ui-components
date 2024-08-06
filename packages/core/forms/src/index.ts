import type { App } from 'vue'
import VueFormGenerator from './components/FormGenerator.vue'
import * as sharedForms from './components/forms'
import FieldTester from './components/fields/__tests__/FieldTester.vue'

// Export Vue plugin as the default
export default {
  install: (app: App): void => {
    app.component('VueFormGenerator', VueFormGenerator)
  },
}

export { customFields } from './components/fields/exports'
export { VueFormGenerator, sharedForms, FieldTester }

export const getSharedFormName = (modelName: string): string => {
  const mapping:Record<string, string> = {
    'openid-connect': 'OIDCForm',
    'post-function': 'PostFunction',
    // Pre and Post function plugins are using same component
    'pre-function': 'PostFunction',
    'exit-transformer': 'ExitTransformer',
    'rate-limiting-advanced': 'RLAForm',
  }

  return mapping[modelName]
}

export * from './const'
export * from './types'
export * as abstractField from './components/fields/abstractField'
