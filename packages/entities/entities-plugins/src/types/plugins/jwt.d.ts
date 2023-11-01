import type { PluginBasicSchema } from '../../types/plugins'

interface JwtFieldSchema {
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

export type JwtSchema = PluginBasicSchema & {
  schema: JwtFieldSchema,
  fields: {
    id: object,
    key: object,
    algorithm: object
  }
}
