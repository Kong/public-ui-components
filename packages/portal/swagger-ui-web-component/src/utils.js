export const attributeValueToBoolean = (value) => {
  return value && value.toLowerCase() === 'true'
}

// Yes, Swagger literally calls it "thing"
export const escapeSwaggerThing = (str) => {
  return decodeURIComponent(str.trim().replace(/\s/g, '_'))
}

export const operationToSwaggerThingArray = (operation) => {
  return [
    'operations',
    operation.tag ? operation.tag : 'default',
    operation.operationId,
  ]
}

export const operationToSwaggerThingId = (operation) => {
  return escapeSwaggerThing(
    operationToSwaggerThingArray(operation).join('-'),
  )
}
