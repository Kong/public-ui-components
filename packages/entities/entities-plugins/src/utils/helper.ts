export interface SchemaRegistry {
  confluent?: {
    authentication?: {
      basic?: {
        username?: string
        password?: string
      }
    }
  }
}

export const stripEmptyBasicFields = (schemaRegistry: SchemaRegistry) => {
  const basicFields = schemaRegistry?.confluent?.authentication?.basic
  if (!basicFields) {
    return
  }

  if (!basicFields.password && !basicFields.username) {
    delete schemaRegistry!.confluent!.authentication!.basic
  }
}
