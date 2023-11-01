import type { GraphQLRateLimitingAdvancedSchema } from '../../types/plugins/graphql-rate-limiting-advanced'

export const graphqlRateLimitingAdvancedSchema: GraphQLRateLimitingAdvancedSchema = {
  'config-strategy': {
    label: 'Config.Strategy',
    type: 'select',
    default: 'cluster',
    values: ['cluster', 'redis'],
  },
}
