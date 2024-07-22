import typedefs from './typedefs'
import type { RequestTransformerAdvancedSchema } from '../../types/plugins/request-transformer-advaced'

const initRequestTransformerAdvancedSchema: RequestTransformerAdvancedSchema = {
  'config-remove-headers': {},
  'config-remove.querystring': {},
  'config-remove-body': {},
  'config-replace-headers': {},
  'config-replace-querystring': {},
  'config-replace-body': {},
  'config-rename-headers': {},
  'config-rename-querystring': {},
  'config-rename-body': {},
  'config-add-headers': {},
  'config-add-querystring': {},
  'config-add-body': {},
  'config-append-headers': {},
  'config-append-querystring': {},
  'config-append-body': {},
  'config-allow-body': {},
}

export const requestTransformerAdvancedSchema: RequestTransformerAdvancedSchema = [
  'config-remove-headers',
  'config-remove.querystring',
  'config-remove-body',
  'config-replace-headers',
  'config-replace-querystring',
  'config-replace-body',
  'config-rename-headers',
  'config-rename-querystring',
  'config-rename-body',
  'config-add-headers',
  'config-add-querystring',
  'config-add-body',
  'config-append-headers',
  'config-append-querystring',
  'config-append-body',
  'config-allow-body',
].reduce((a, v) => ({
  ...a,
  [v]: typedefs.fields.arrayItems({
    newElementButtonLabel: 'Add',
  }),
}), initRequestTransformerAdvancedSchema)
