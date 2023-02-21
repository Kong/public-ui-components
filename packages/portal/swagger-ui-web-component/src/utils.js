import { helpers } from 'swagger-client'

export const attributeValueToBoolean = (value) => {
  return value && value.toLowerCase() === 'true'
}

// Yes, Swagger literally calls it "thing"
export const escapeSwaggerThing = (str) => {
  return decodeURIComponent(str.trim().replace(/\s/g, '_'))
}

export const operationToSwaggerThingArray = (operation) => {
  console.log(operation, operation.operationId)
  return [
    'operations',
    operation.tag ? operation.tag : 'default',
    operation.operationId ? operation.operationId : helpers.opId(operation, operation.path, operation.method),
  ]
}

export const operationToSwaggerThingId = (operation) => {
  return escapeSwaggerThing(
    operationToSwaggerThingArray(operation).join('-'),
  )
}
