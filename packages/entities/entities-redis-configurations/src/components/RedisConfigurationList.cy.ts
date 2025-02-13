import type { KongManagerRedisConfigurationListConfig } from 'src/types'
import RedisConfigurationList from './RedisConfigurationList.vue'

const baseConfigKM: KongManagerRedisConfigurationListConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  isExactMatch: false,
  filterSchema: {},
  createRoute: { name: 'redis-configuration-create' },
  getViewRoute: (id) => ({ name: 'redis-configuration-details', params: { id } }),
  getEditRoute: (id) => ({ name: 'redis-configuration-edit', params: { id } }),
}

describe('<RedisConfigurationList />', () => {
  for (const expected of [false, true]) {
    describe(expected ? 'allowed' : 'denied', () => {
      it(`should ${expected ? 'allow' : 'deny'} to create a new RedisConfiguration`, () => {
        // cy.mount(RedisConfigurationList, {
        // })
      })
    })
  }
})
