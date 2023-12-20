import type { CommonSchemaFields, Field, PluginBasicSchema } from '../../types/plugins/shared'

export interface JWTPluginSchema extends CommonSchemaFields{
  'config-cookie_names': Field,
  'config-uri_param_names': Field,
}

interface JwtSecretFieldSchema {
  fields: [
    {
      key: {
        submitWhenNull?: boolean
        hint: string
      }
    },
    {
      algorithm: {
        order: number,
        hint: string
      }
    },
    {
      rsa_public_key: {
        order: number,
        type: string,
        label: string,
        hint: string,
        rows: number,
        visible: (model: any) => any,
      }
    },
    {
      secret: {
        inputType: string,
        hint: string
      }
    }
  ]
}

export type JwtSchema = PluginBasicSchema & CommonSchemaFields & {
  schema: JwtSecretFieldSchema,
  fields: {
    id: object,
    key: object,
    algorithm: object
  }
}
