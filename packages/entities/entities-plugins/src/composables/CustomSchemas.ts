import { applicationRegistrationSchema } from './plugin-schemas/ApplicationRegistration'
import { dataDogSchema } from './plugin-schemas/Datadog'
import { statsDAdvancedSchema } from './plugin-schemas/StatsDAdvanced'
import { kafkaSchema } from './plugin-schemas/Kafka'
import { mockingSchema } from './plugin-schemas/Mocking'
import { preFunctionSchema } from './plugin-schemas/PreFunction'
import { rateLimitingSchema } from './plugin-schemas/RateLimiting'
import { requestTransformerAdvancedSchema } from './plugin-schemas/RequestTransformerAdvanced'
import { graphqlRateLimitingAdvancedSchema } from './plugin-schemas/GraphQLRateLimitingAdvanced'
import { statsDSchema } from './plugin-schemas/StatsD'
import RequestValidatorSchema from './plugin-schemas/RequestValidator'
import ZipkinSchema from './plugin-schemas/Zipkin'
import type { CustomSchemas } from '../types'

export const customSchemas: CustomSchemas = {
  'application-registration': {
    overwriteDefault: true,
    formSchema: {
      ...applicationRegistrationSchema,
    },
  },

  datadog: {
    ...dataDogSchema,
  },

  'upstream-tls': {
    'config-trusted_certificates': {
      type: 'textArea',
      valueType: 'array',
      rows: 4,
      help: 'A comma separated list of certificate values',
    },
  },

  'kafka-upstream': {
    ...kafkaSchema,
  },

  'kafka-log': {
    ...kafkaSchema,
  },

  statsd: {
    ...statsDSchema,
  },

  'statsd-advanced': {
    ...statsDAdvancedSchema,
  },

  'route-by-header': {
    configurationDisabled: true,
  },

  mocking: {
    ...mockingSchema,
  },

  'rate-limiting': {
    useKonnectSchema: true,
    ...rateLimitingSchema,
  },

  'rate-limiting-advanced': {
    useKonnectSchema: true,
    ...rateLimitingSchema,
  },

  'graphql-rate-limiting-advanced': {
    useKonnectSchema: true,
    ...graphqlRateLimitingAdvancedSchema,
  },

  'response-ratelimiting': {
    useKonnectSchema: true,
    ...rateLimitingSchema,
  },

  'pre-function': {
    ...preFunctionSchema,
  },
  // both post and pre function plugin forms need identical schema overrides, so we use PreFunction for both
  'post-function': {
    ...preFunctionSchema,
  },

  'request-transformer-advanced': {
    ...requestTransformerAdvancedSchema,
  },

  'request-validator': {
    ...RequestValidatorSchema,
  },

  zipkin: {
    ...ZipkinSchema,
  },
}
