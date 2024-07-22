import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface UpstreamTlsSchema extends CommonSchemaFields {
  'config-trusted_certificates': {
    type: string
    valueType: string
    rows: number
    help: string
  }
}
