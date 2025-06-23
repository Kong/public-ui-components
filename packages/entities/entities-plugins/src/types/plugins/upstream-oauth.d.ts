import type { CommonSchemaFields } from './shared'

export interface UpstreamOauthSchema extends CommonSchemaFields {
  'config-behavior-idp_error_response_body_template': {
    type: string
    rows: number
  }
}
