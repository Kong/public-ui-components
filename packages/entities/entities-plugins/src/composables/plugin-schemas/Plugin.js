import { applyAutodocDesc } from './transform'
import * as typedefs from './typedefs'

const schema = {
  name: {
    label: 'Name',
    type: 'input',
    inputType: 'text',
    searchable: true,
  },
  instance_name: {
    label: 'Instance Name',
    type: 'input',
    inputType: 'text',
    searchable: true,
  },
  enabled: {
    label: 'Enabled',
    type: 'checkbox',
    default: true,
  },
  service: {
    label: 'Gateway Service',
    type: 'input',
    inputType: 'text',
  },
  route: {
    label: 'Route',
    type: 'input',
    inputType: 'text',
  },
  consumer: {
    label: 'Consumer',
    type: 'input',
    inputType: 'text',
  },
  config: {
    label: 'Config',
    type: 'input',
    inputType: 'text',
  },
}

Object.entries(schema).forEach(([key, field]) => {
  applyAutodocDesc(field, 'plugins', key)
})

export const configSchema = (() => {
  const c = {
    id: typedefs.id,
    ...schema,
    tags: typedefs.tags,
  }

  Object.entries(c).forEach(([key, field]) => {
    applyAutodocDesc(field, 'plugins', key)
  })

  return c
})()

export default schema
