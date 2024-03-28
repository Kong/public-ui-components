import typedefs from './typedefs'
import type { PreFunctionSchema } from '../../types/plugins/pre-function'

const initPreFunctionSchema: PreFunctionSchema = {
  'config-access': {},
  'config-body_filter': {},
  'config-header_filter': {},
  'config-certificate': {},
  'config-functions': {},
  'config-log': {},
  'config-rewrite': {},
}

export const preFunctionSchema: PreFunctionSchema = [
  'config-access',
  'config-body_filter',
  'config-header_filter',
  'config-certificate',
  'config-functions',
  'config-log',
  'config-rewrite',
].reduce((a, v) => ({
  ...a,
  [v]: typedefs.fields.arrayItems({
    newElementButtonLabel: 'Add',
  }),
}), initPreFunctionSchema)
