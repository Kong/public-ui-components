import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'
import type { tags } from '../../definitions/schemas/typedefs'

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
    },
    {
      tags: typeof tags,
    },
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
