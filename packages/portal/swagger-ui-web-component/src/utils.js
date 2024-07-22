import { helpers } from 'swagger-client'

export const attributeValueToBoolean = (value) => {
  return value && value.toLowerCase() === 'true'
}

// Yes, Swagger literally calls it "thing"
export const escapeSwaggerThing = (str) => {
  return escapeDeepLinkPath(str)
}

export const operationToSwaggerThingArray = (operation) => {
  return [
    'operations',
    operation.tag ? operation.tag : 'default',
    operation.operationId ? operation.operationId : helpers.opId(operation, operation.path, operation.method),
  ]
}

// suitable for use in URL fragments
export const createDeepLinkPath = (str) => typeof str === 'string' || str instanceof String ? str.trim().replace(/\s/g, '%20') : ''
// suitable for use in CSS classes and ids
export const escapeDeepLinkPath = (str) => CSS.escape(createDeepLinkPath(str).replace(/%20/g, '_'))

export const operationToSwaggerThingId = (operation) => {
  return escapeSwaggerThing(
    operationToSwaggerThingArray(operation).join('-'),
  )
}
