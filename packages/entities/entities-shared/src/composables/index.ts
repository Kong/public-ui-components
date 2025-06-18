import useAxios from './useAxios'
import useDebouncedFilter from './useDebouncedFilter'
import useDeleteUrlBuilder from './useDeleteUrlBuilder'
import useErrors from './useErrors'
import useExternalLinkCreator from './useExternalLinkCreator'
import useFetcher, { useFetcherCacheKey } from './useFetcher'
import useFetchUrlBuilder from './useFetchUrlBuilder'
import useHelpers from './useHelpers'
import useStringHelpers from './useStringHelpers'
import useI18n from './useI18n'
import useGatewayFeatureSupported from './useGatewayFeatureSupported'
import useTruncationDetector from './useTruncationDetector'
import useValidators from './useValidators'
import { useSchemaProvider, useSubSchema } from './useSchema'
import useTableState from './useTableState'
import { useDeclarativeRoutesFetcher } from './useDeclarativeFetcher'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useAxios,
  useDebouncedFilter,
  useDeclarativeRoutesFetcher,
  useDeleteUrlBuilder,
  useErrors,
  useExternalLinkCreator,
  useFetcher,
  useFetcherCacheKey,
  useFetchUrlBuilder,
  useHelpers,
  useStringHelpers,
  useI18n,
  useGatewayFeatureSupported,
  useTruncationDetector,
  useValidators,
  useSchemaProvider,
  useSubSchema,
  useTableState,
}
