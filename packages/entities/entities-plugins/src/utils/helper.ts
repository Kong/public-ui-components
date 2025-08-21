import { isEqual } from 'lodash-es'

export interface SchemaRegistry {
  confluent?: {
    authentication?: {
      basic?: {
        username?: string
        password?: string
      }
      mode?: string
    }
    ssl_verify?: boolean
  } | null
}

const isDefaultConfluent = (confluent: SchemaRegistry['confluent']): boolean => {
  const keys = Object.keys(confluent!)
  if (keys.length === 0) return true

  // kafka-upstream, kafka-log, kafka-upstream
  if (keys.length === 2 && keys.includes('ssl_verify') && keys.includes('authentication')) {
    return isEqual(confluent!, {
      ssl_verify: true,
      authentication: {
        mode: 'none',
      },
    })
  }
  return false
}

export const stripEmptyBasicFields = (schemaRegistry: SchemaRegistry) => {
  if (schemaRegistry.confluent && isDefaultConfluent(schemaRegistry?.confluent)) {
    schemaRegistry.confluent = null
  }

  const basicFields = schemaRegistry?.confluent?.authentication?.basic
  if (!basicFields) {
    return
  }

  if (!basicFields.password && !basicFields.username) {
    delete schemaRegistry!.confluent!.authentication!.basic
  }
}
