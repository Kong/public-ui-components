import RedisConfigurationConfigCard from './RedisConfigurationConfigCard.vue'
import {
  redisConfigurationCE,
  redisConfigurationHostPortEE,
  redisConfigurationCluster,
  redisConfigurationSentinel,
} from '../../fixtures/mockData'

import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
  RedisConfigurationResponse,
} from '../types'

const kmConfig: KongManagerRedisConfigurationEntityConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  entityId: redisConfigurationCE.id,
  cloudAuthAvailable: true,
}

const konnectConfig: KonnectRedisConfigurationEntityConfig = {
  app: 'konnect',
  controlPlaneId: '1',
  apiBaseUrl: '/us/kong-api',
  entityId: redisConfigurationCE.id,
  cloudAuthAvailable: true,
}

describe('<RedisConfigurationConfigCard/>', {
  viewportHeight: 700,
  viewportWidth: 700,
}, () => {
  for (const app of ['Konnect', 'Kong Admin']) {
    const interceptGetRedisConfiguration = ({
      body = redisConfigurationCE,
      status = 200,
    }: {
      body?: RedisConfigurationResponse
      status?: number
    } = {}): void => {
      if (app === 'Konnect') {
        cy.intercept(
          {
            method: 'GET',
            url: `${konnectConfig.apiBaseUrl}/v2/control-planes/${konnectConfig.controlPlaneId}/core-entities/partials/*`,
          },
          {
            statusCode: status,
            body,
          },
        ).as('getRedisConfiguration')
      } else {
        cy.intercept(
          {
            method: 'GET',
            url: `${kmConfig.apiBaseUrl}/${kmConfig.workspace}/partials/*`,
          },
          {
            statusCode: status,
            body,
          },
        ).as('getRedisConfiguration')
      }
    }

    describe(app, () => {
      it('emits loading event when EntityBaseConfigCard emits loading event', () => {
        interceptGetRedisConfiguration()

        cy.mount(RedisConfigurationConfigCard, {
          props: {
            config: app === 'Konnect' ? konnectConfig : kmConfig,
            onLoading: cy.spy().as('onLoadingSpy'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getRedisConfiguration')

        cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(RedisConfigurationConfigCard)
          .vm.$emit('loading', true))

        cy.get('@onLoadingSpy').should('have.been.calledWith', true)
      })

      it('emits fetch:error event when EntityBaseConfigCard emits fetch:error event', () => {
        interceptGetRedisConfiguration()

        cy.mount(RedisConfigurationConfigCard, {
          props: {
            config: app === 'Konnect' ? konnectConfig : kmConfig,
            'onFetch:error': cy.spy().as('onError'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getRedisConfiguration')

        cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(RedisConfigurationConfigCard)
          .vm.$emit('fetch:error', { message: 'text' }))

        cy.get('@onError').should('have.been.calledWith', { message: 'text' })
      })

      it('emits fetch:success event when EntityBaseConfigCard emits fetch:success event', () => {
        interceptGetRedisConfiguration()

        cy.mount(RedisConfigurationConfigCard, {
          props: {
            config: app === 'Konnect' ? konnectConfig : kmConfig,
            'onFetch:success': cy.spy().as('onFetch'),
          },
        }).then(({ wrapper }) => wrapper)
          .as('vueWrapper')

        cy.wait('@getRedisConfiguration')

        cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(RedisConfigurationConfigCard)
          .vm.$emit('fetch:success'))

        cy.get('@onFetch').should('have.been.called')
      })

      describe('fields', () => {
        it('only shows host/port CE fields', () => {
          interceptGetRedisConfiguration()

          cy.mount(RedisConfigurationConfigCard, {
            props: {
              config: app === 'Konnect' ? konnectConfig : kmConfig,
            },
          })

          cy.wait('@getRedisConfiguration')

          const fieldsShouldExist = [
            'host-label',
            'port-label',
            'timeout-label',
          ]

          const fieldsShouldNotExist = [
            'connection_is_proxied-label',
            'keepalive_backlog-label',
            'keepalive_pool_size-label',
            'read_timeout-label',
            'send_timeout-label',
            'connect_timeout-label',
            'cluster_nodes-label',
            'cluster_max_redirections-label',
            'sentinel_master-label',
            'sentinel_role-label',
            'sentinel_nodes-label',
            'sentinel_username-label',
            'sentinel_password-label',
          ]

          fieldsShouldExist.forEach((field) => {
            cy.getTestId(field).should('exist')
          })

          fieldsShouldNotExist.forEach((field) => {
            cy.getTestId(field).should('not.exist')
          })
        })

        it('only shows host/port EE fields', () => {
          interceptGetRedisConfiguration({ body: redisConfigurationHostPortEE })

          cy.mount(RedisConfigurationConfigCard, {
            props: {
              config: app === 'Konnect'
                ? { ...konnectConfig, entityId: redisConfigurationHostPortEE.id }
                : { ...kmConfig, entityId: redisConfigurationHostPortEE.id },
            },
          })

          cy.wait('@getRedisConfiguration')

          const fieldsShouldExist = [
            'host-label',
            'port-label',
            'connection_is_proxied-label',
            'keepalive_backlog-label',
            'keepalive_pool_size-label',
            'read_timeout-label',
            'send_timeout-label',
            'connect_timeout-label',
          ]

          const fieldsShouldNotExist = [
            'timeout-label',
            'cluster_nodes-label',
            'cluster_max_redirections-label',
            'sentinel_master-label',
            'sentinel_role-label',
            'sentinel_nodes-label',
            'sentinel_username-label',
            'sentinel_password-label',
          ]

          fieldsShouldExist.forEach((field) => {
            cy.getTestId(field).should('exist')
          })

          fieldsShouldNotExist.forEach((field) => {
            cy.getTestId(field).should('not.exist')
          })
        })

        it('only shows Cluster EE fields', () => {
          interceptGetRedisConfiguration({ body: redisConfigurationCluster })

          cy.mount(RedisConfigurationConfigCard, {
            props: {
              config: app === 'Konnect'
                ? { ...konnectConfig, entityId: redisConfigurationCluster.id }
                : { ...kmConfig, entityId: redisConfigurationCluster.id },
            },
          })

          cy.wait('@getRedisConfiguration')

          const fieldsShouldExist = [
            'cluster_nodes-label',
            'cluster_max_redirections-label',
            'keepalive_backlog-label',
            'keepalive_pool_size-label',
            'read_timeout-label',
            'send_timeout-label',
            'connect_timeout-label',
          ]

          const fieldsShouldNotExist = [
            'host-label',
            // 'port-label', // Port is shown in cluster nodes
            'timeout-label',
            'sentinel_master-label',
            'sentinel_role-label',
            'sentinel_nodes-label',
            'sentinel_username-label',
            'sentinel_password-label',
            'connection_is_proxied-label',
          ]

          fieldsShouldExist.forEach((field) => {
            cy.getTestId(field).should('exist')
          })

          fieldsShouldNotExist.forEach((field) => {
            cy.getTestId(field).should('not.exist')
          })
        })

        it('only shows Sentinel EE fields', () => {
          interceptGetRedisConfiguration({ body: redisConfigurationSentinel })

          cy.mount(RedisConfigurationConfigCard, {
            props: {
              config: app === 'Konnect'
                ? { ...konnectConfig, entityId: redisConfigurationSentinel.id }
                : { ...kmConfig, entityId: redisConfigurationSentinel.id },
            },
          })

          cy.wait('@getRedisConfiguration')

          const fieldsShouldExist = [
            'sentinel_master-label',
            'sentinel_role-label',
            'sentinel_nodes-label',
            'sentinel_username-label',
            'sentinel_password-label',
            'keepalive_backlog-label',
            'keepalive_pool_size-label',
            'read_timeout-label',
            'send_timeout-label',
            'connect_timeout-label',
          ]

          const fieldsShouldNotExist = [
            // 'host-label', // Host is shown in sentinel nodes
            // 'port-label', // Port is shown in sentinel nodes
            'timeout-label',
            'connection_is_proxied-label',
            'cluster_nodes-label',
            'cluster_max_redirections-label',
          ]

          fieldsShouldExist.forEach((field) => {
            cy.getTestId(field).should('exist')
          })

          fieldsShouldNotExist.forEach((field) => {
            cy.getTestId(field).should('not.exist')
          })
        })

        it('only shows AWS fields in cloud auth', () => {
          interceptGetRedisConfiguration()

          cy.mount(RedisConfigurationConfigCard, {
            props: {
              config: app === 'Konnect' ? konnectConfig : kmConfig,
            },
          })

          cy.wait('@getRedisConfiguration')

          const fieldsShouldExist = [
            'auth_provider-label',
            'aws_cache_name-label',
            'aws_region-label',
            'aws_is_serverless-label',
            'aws_access_key_id-label',
            'aws_secret_access_key-label',
            'aws_assume_role_arn-label',
            'aws_role_session_name-label',
          ]

          const fieldsShouldNotExist = [
            'gcp_service_account_json-label',
            'azure_client_id-label',
            'azure_client_secret-label',
            'azure_tenant_id-label',
          ]

          fieldsShouldExist.forEach((field) => {
            cy.getTestId(field).should('exist')
          })

          fieldsShouldNotExist.forEach((field) => {
            cy.getTestId(field).should('not.exist')
          })
        })
      })
    })
  }
})
