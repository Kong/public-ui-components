import * as _ from 'lodash-es'

const schema = {
  id: { label: 'ID' },
  application: {
    fields: {
      id: { label: 'ID' },
      name: { label: 'Name' },
      consumer: { label: 'Consumer' },
      developer: { label: 'Developer' },
      redirect_uri: { label: 'Redirect URI' },
    },
  },
  status: { label: 'Status' },
  service: { label: 'Gateway Service' },
}

export const configSchema = (() => _.cloneDeep(schema))()

export default schema
