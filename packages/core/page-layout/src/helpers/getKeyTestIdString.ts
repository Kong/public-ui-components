/**
 * @description Transform the key string to kebab-case regardless of the original case
 * Example: 'apiGateway' => 'api-gateway', 'ApiGateway' => 'api-gateway', 'API_GATEWAY' => 'api-gateway', 'APIGateway' => 'api-gateway'
 * @param {string} key - The key string to transform
 * @return {string} The transformed key string
 */
const getKeyTestIdString = (key: string): string => {
  return key
    // Replace underscores with hyphens
    .replace(/_/g, '-')
    // Insert hyphen before uppercase letters that follow lowercase letters or numbers
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Insert hyphen before uppercase letter that is followed by lowercase letter (handles consecutive caps like "APIGateway")
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    // Convert to lowercase
    .toLowerCase()
}

export default getKeyTestIdString
