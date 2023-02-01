import { helpers } from 'swagger-client'

export const attributeValueToBoolean = (value) => {
  return value && value.toLowerCase() === 'true'
}

// Yes, Swagger literally calls it "thing"
export const escapeSwaggerThing = (str) => CSS.escape(str.trim().replace(/\s/g, '%20'))

export const operationToSwaggerThingArray = (operation) => ([
  'operations',
  operation.tag ? escapeSwaggerThing(operation.tag) : 'default',
  helpers.opId(operation, operation.path, operation.method),
])

export const operationToSwaggerThingId = (operation) => escapeSwaggerThing(
  operationToSwaggerThingArray(operation).join('-'),
)
