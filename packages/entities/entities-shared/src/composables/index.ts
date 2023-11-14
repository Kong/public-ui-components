import useAxios from './useAxios'
import useDebouncedFilter from './useDebouncedFilter'
import useDeleteUrlBuilder from './useDeleteUrlBuilder'
import useErrors from './useErrors'
import useExternalLinkCreator from './useExternalLinkCreator'
import useFetcher from './useFetcher'
import useFetchUrlBuilder from './useFetchUrlBuilder'
import useHelpers from './useHelpers'
import useStringHelpers from './useStringHelpers'
import useI18n from './useI18n'
import useGatewayFeatureSupported from './useGatewayFeatureSupported'
import useTruncationDetector from './useTruncationDetector'
import useToaster from './useToaster'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useAxios,
  useDebouncedFilter,
  useDeleteUrlBuilder,
  useErrors,
  useExternalLinkCreator,
  useFetcher,
  useFetchUrlBuilder,
  useHelpers,
  useStringHelpers,
  useI18n,
  useGatewayFeatureSupported,
  useTruncationDetector,
  useToaster,
}
