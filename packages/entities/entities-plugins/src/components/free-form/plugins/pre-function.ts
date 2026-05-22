import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

const LUA_FUNCTION_FIELDS = [
  'access',
  'body_filter',
  'certificate',
  'functions',
  'header_filter',
  'log',
  'rewrite',
]

export default definePluginConfig({
  experimental: true,
  fieldRenderers: LUA_FUNCTION_FIELDS.map((field) => ({
    match: ({ genericPath }) => genericPath === `config.${field}.*`,
    component: StringField,
    propsOverrides: (props) => ({
      ...props,
      multiline: true,
      rows: 3,
    }),
  })),
})
