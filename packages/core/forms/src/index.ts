import type { App } from 'vue'
import VueFormGenerator from './generator/FormGenerator.vue'
import * as sharedForms from './forms'

// Export Vue plugin as the default
export default {
  install: (app: App): void => {
    app.component('VueFormGenerator', VueFormGenerator)
  },
}

export { customFields } from './generator/fields/advanced/exports'
export { VueFormGenerator, sharedForms }

export const getSharedFormName = (modelName: string, enabledAcmeCustomTemplate = false): string => {
  const mapping:Record<string, string> = {
    ...(enabledAcmeCustomTemplate && { acme: 'ACMEForm' }),
    'openid-connect': 'OIDCForm',
    'post-function': 'PostFunction',
    // Pre and Post function plugins are using same component
    'pre-function': 'PostFunction',
    'exit-transformer': 'ExitTransformer',
  }

  return mapping[modelName]
}

export * from './const'
export * as abstractField from './generator/fields/abstractField'
