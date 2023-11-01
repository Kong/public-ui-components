import type { PluginBasicSchema } from '../../types/plugins'

interface HmacAuthFieldSchema {
  fields: [
    {
      username: {
        hint: string
      }
    },
    {
      secret: {
        inputType: string
        submitWhenNull?: boolean
        hint: string
      }
    }
  ]
}

export type HmacAuthSchema = PluginBasicSchema & {
  schema: HmacAuthFieldSchema,
  fields: any
}
