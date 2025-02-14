import useAbstractFields from './useAbstractFields'
import useRedisPartial from './useRedisPartial'
import useRedisNonStandardFields from './useRedisNonStandardFields'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useAbstractFields,
  useRedisPartial,
  useRedisNonStandardFields,
}
