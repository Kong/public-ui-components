// Forked and edited from https://github.com/vue-generators/vue-form-generator
// License of the original repository:

/*
The MIT License (MIT)

Copyright (c) 2016 Icebob

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import type { App } from 'vue'
import validators from './generator/utils/validators'
import VueFormGenerator from './generator/FormGenerator.vue'
import * as sharedForms from './forms'
import { FORMS_API_KEY } from './const'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    app.component(options.name || 'VueFormGenerator', VueFormGenerator)
  },
}

export { customFields } from './generator/fields/advanced/exports'

// this is to make kong-manager consume it old way with minimal changes
export const vfgPlugin = {
  install(app: App, options: { name?: string, [key: string]: any } = {}) {
    app.component(options.name || 'VueFormGenerator', VueFormGenerator)
    if (options.validators) {
      for (const key in options.validators) {
        if ({}.hasOwnProperty.call(options.validators, key)) {
          validators[key] = options.validators[key]
        }
      }
    }
    if (options.apiService) {
      app.provide(FORMS_API_KEY, options.apiService)
    }
  },
}

export { VueFormGenerator, sharedForms }

export const getSharedFormName = (modelName: string): string => {
  const mapping:Record<string, string> = {
    'openid-connect': 'OIDCForm',
    'post-function': 'PostFunction',
    // Pre- and Post-function plugins are using the same component
    'pre-function': 'PostFunction',
  }

  return mapping[modelName]
}

export * from './const'
export * as abstractField from './generator/fields/abstractField'
