import type { RateLimitingSchema } from '../../types/plugins/rate-limiting'

export const rateLimitingSchema: RateLimitingSchema = {
  'config-policy': {
    label: 'Policy',
    type: 'select',
    default: 'redis',
    values: ['local', 'redis'],
  },
  'config-strategy': {
    label: 'Strategy',
    type: 'select',
    default: 'redis',
    values: ['local', 'redis'],
  },
  'config-consumer_groups': {
    label: 'Consumer Groups',
    type: 'input',
    placeholder: 'Enter list of consumer groups',
    hint: 'e.g. group1, group2',
  },
}
