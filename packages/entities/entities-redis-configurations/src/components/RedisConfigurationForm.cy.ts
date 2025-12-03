import RedisConfigurationForm from './RedisConfigurationForm.vue'
import { PartialType, RedisType, AuthProvider, type RedisConfigurationResponse } from '../types'
import { redisConfigurationCE, redisConfigurationCluster, redisConfigurationHostPortEE, redisConfigurationSentinel, links } from '../../fixtures/mockData'

import type {
  KongManagerRedisConfigurationFormConfig,
  KonnectRedisConfigurationFormConfig,
} from '../types/redis-configuration-form'
import type { RouteHandler } from 'cypress/types/net-stubbing'

const cancelRoute = { name: 'redis-configuration-list' }

const baseConfigKM: KongManagerRedisConfigurationFormConfig = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
  cloudAuthAvailable: true,
  isPortReferenceable: true,
  cancelRoute,
}

const baseConfigKonnect: KonnectRedisConfigurationFormConfig = {
  app: 'konnect',
  controlPlaneId: 'test-control-plane-id',
  apiBaseUrl: '/us/kong-api',
  cloudAuthAvailable: true,
  isPortReferenceable: true,
  cancelRoute,
}

describe('<RedisConfigurationForm />', {
  viewportHeight: 700,
  viewportWidth: 700,
}, () => {

  for (const app of ['Kong Manager', 'Konnect']) {
    describe(app, () => {
      const config = app === 'Kong Manager' ? baseConfigKM : baseConfigKonnect

      const stubCreateEdit = ({ status = 200 }: { status?: number } = {}) => {
        const handler: RouteHandler = req => {
          const { body: { name, type, config } } = req
          req.reply({
            statusCode: status,
            body: {
              name: name,
              type: type,
              config: config,
              id: 'test-id',
            },
          })
        }

        if (app === 'Kong Manager') {
          cy.intercept('POST', `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials`, handler)
            .as('createRedisConfiguration')

          cy.intercept('PATCH', `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/*`, handler)
            .as('editRedisConfiguration')
        } else {
          cy.intercept('POST', `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials`, handler)
            .as('createRedisConfiguration')

          cy.intercept('PUT', `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials/*`, handler)
            .as('editRedisConfiguration')
        }
      }

      const interceptDetail = ({
        body = redisConfigurationCE,
        status = 200,
      }: {
        body?: RedisConfigurationResponse
        status?: number
      } = {}) => {
        if (app === 'Kong Manager') {
          cy.intercept('GET', `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/*`, {
            statusCode: status,
            body,
          }).as('getRedisConfiguration')
        } else {
          cy.intercept('GET', `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials/*`, {
            statusCode: status,
            body,
          }).as('getRedisConfiguration')
        }
      }

      function interceptLinkedPlugins({
        body = { data: [], next: null, count: 0 },
      }: {
        body?: typeof links
      } = {}) {
        if (app === 'Kong Manager') {
          cy.intercept({
            method: 'GET',
            url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/*/links*`,
          }, {
            statusCode: 200,
            body,
          }).as('getLinkedPlugins')
        } else {
          cy.intercept({
            method: 'GET',
            url: `${baseConfigKonnect.apiBaseUrl}/v2/control-planes/${baseConfigKonnect.controlPlaneId}/core-entities/partials/*/links*`,
          }, {
            statusCode: 200,
            body,
          }).as('getLinkedPlugins')
        }
      }

      it('should show create form', () => {
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.get('.kong-ui-entities-redis-configurations-form').should('be.visible')
        cy.get('.kong-ui-entities-redis-configurations-form form').should('be.visible')

        // button state
        cy.getTestId('partial-create-form-cancel').should('be.visible')
        cy.getTestId('partial-create-form-cancel').should('be.enabled')
        cy.getTestId('partial-create-form-submit').should('be.visible')
        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // form fields
        cy.getTestId('redis-type-select').should('be.visible')
        cy.getTestId('redis-name-input').should('be.visible')

        // redis type select items
        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .should('be.visible')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_CE}"]`)
          .should('be.visible')
          .should('be.enabled')
          .should('have.attr', 'value', RedisType.HOST_PORT_CE)

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
          .should('be.visible')
          .should('be.enabled')
          .should('have.attr', 'value', RedisType.HOST_PORT_EE)

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.CLUSTER}"]`)
          .should('be.visible')
          .should('be.enabled')
          .should('have.attr', 'value', RedisType.CLUSTER)

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.SENTINEL}"]`)
          .should('be.visible')
          .should('be.enabled')
          .should('have.attr', 'value', RedisType.SENTINEL)

        // CE fields
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_CE}"]`)
          .click()

        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-keepalive-section').should('not.exist')
        cy.getTestId('redis-read-write-configuration-section').should('not.exist')
        cy.getTestId('redis-connection-is-proxied-checkbox').should('not.exist')

        cy.getTestId('redis-host-input').should('be.visible')
        cy.getTestId('redis-port-input').should('be.visible')
        cy.getTestId('redis-timeout-input').should('be.visible')
        cy.getTestId('redis-auth-provider-select').should('be.visible')

        // Host/Port EE fields
        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
          .click()

        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')

        cy.getTestId('redis-host-input').should('be.visible')
        cy.getTestId('redis-port-input').should('be.visible')
        cy.getTestId('secret-picker-provider-for-port').should('be.visible')
        cy.getTestId('redis-connection-is-proxied-checkbox').should('be.visible')
        cy.getTestId('redis-keepalive-section').should('be.visible')
        cy.getTestId('redis-read-write-configuration-section').should('be.visible')
        cy.getTestId('redis-auth-provider-select').should('be.visible')

        // Cluster fields
        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.CLUSTER}"]`)
          .click()

        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-host-input').should('not.exist')
        cy.getTestId('redis-port-input').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')

        cy.getTestId('redis-keepalive-section').should('be.visible')
        cy.getTestId('redis-read-write-configuration-section').should('be.visible')
        cy.getTestId('redis-cluster-configuration-section').should('be.visible')
        cy.getTestId('redis-auth-provider-select').should('be.visible')

        // Sentinel fields
        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.SENTINEL}"]`)
          .click()

        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-host-input').should('not.exist')
        cy.getTestId('redis-port-input').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')
        cy.getTestId('redis-auth-provider-select').should('not.exist')

        cy.getTestId('redis-keepalive-section').should('be.visible')
        cy.getTestId('redis-read-write-configuration-section').should('be.visible')
        cy.getTestId('redis-sentinel-configuration-section').should('be.visible')
      })

      it('should correctly handle button state - create CE', () => {
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_CE}"]`)
          .click()

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-name-input').type('test')

        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-host-input').clear()
        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-host-input').type('localhost')
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.AWS}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.disabled')
        cy.getTestId('redis-aws_cache_name-input').type('test-cache')
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.GCP}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.AZURE}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-port-input').clear()
        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-port-input').type('6379')
        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')
          .click()

        cy.wait('@createRedisConfiguration')

        cy.getTestId('partial-create-form-submit').should('be.disabled')
      })

      it('should correctly handle button state - create Host/port EE', () => {
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
          .click()

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-name-input').type('test')

        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-host-input').clear()
        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-host-input').type('localhost')
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.AWS}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.disabled')
        cy.getTestId('redis-aws_cache_name-input').type('test-cache')
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.GCP}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.AZURE}"]`)
          .click()
        cy.getTestId('partial-create-form-submit').should('be.enabled')

        cy.getTestId('redis-port-input').clear()
        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-port-input').type('6379')
        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')
          .click()

        cy.wait('@createRedisConfiguration')

        cy.getTestId('partial-create-form-submit').should('be.disabled')
      })

      it('should correctly handle button state - create Cluster', () => {
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.CLUSTER}"]`)
          .click()

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        cy.getTestId('redis-name-input').type('test')

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // Add cluster node
        cy.getTestId('redis-add-cluster-node-button').click()

        cy.getTestId('redis-cluster-nodes').should('be.visible')

        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')

        // Remove cluster node
        cy.getTestId('redis-cluster-nodes').find('button.array-card-remove-button').click()

        cy.getTestId('partial-create-form-submit')
          .should('be.disabled')

        // Add cluster node again but set invalid values
        cy.getTestId('redis-add-cluster-node-button').click()
        cy.getTestId('redis-cluster-nodes').find('input[name="ip"]').clear()
        cy.getTestId('partial-create-form-submit')
          .should('be.disabled')

        // Aet valid value
        cy.getTestId('redis-cluster-nodes').find('input[name="ip"]').type('127.0.0.1')

        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')
          .click()

        cy.wait('@createRedisConfiguration')

        cy.getTestId('partial-create-form-submit').should('be.disabled')
      })

      it('should correctly handle button state - create Sentinel', () => {
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.SENTINEL}"]`)
          .click()

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // Set name
        cy.getTestId('redis-name-input').type('test')

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // Set sentinel master
        cy.getTestId('redis-sentinel-master-input').type('master')

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // Set sentinel role
        cy.getTestId('redis-sentinel-role-select').click()
        cy.getTestId('redis-sentinel-role-select-popover')
          .should('be.visible')
          .find('button:eq(0)')
          .click()

        cy.getTestId('partial-create-form-submit').should('be.disabled')

        // Add sentinel node
        cy.getTestId('redis-add-sentinel-node-button').click()

        cy.getTestId('redis-sentinel-nodes').should('be.visible')

        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')

        // Remove sentinel node
        cy.getTestId('redis-sentinel-nodes').find('button.array-card-remove-button').click()

        cy.getTestId('partial-create-form-submit')
          .should('be.disabled')

        // Add sentinel node again but set invalid values
        cy.getTestId('redis-add-sentinel-node-button').click()
        cy.getTestId('redis-sentinel-nodes').find('input[name="host"]').clear()
        cy.getTestId('partial-create-form-submit')
          .should('be.disabled')

        // Aet valid value
        cy.getTestId('redis-sentinel-nodes').find('input[name="host"]').type('localhost')

        cy.getTestId('partial-create-form-submit')
          .should('be.enabled')
          .click()

        cy.wait('@createRedisConfiguration')

        cy.getTestId('partial-create-form-submit').should('be.disabled')
      })

      it('should show edit form', () => {
        // CE
        interceptDetail({ body: redisConfigurationCE })
        interceptLinkedPlugins()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-type-select-popover').should('contain.text', 'Host/Port (Open Source)')

        // button state
        cy.getTestId('partial-edit-form-submit').should('be.visible')
        cy.getTestId('partial-edit-form-submit').should('be.disabled')
        cy.getTestId('partial-edit-form-cancel').should('be.visible')
        cy.getTestId('partial-edit-form-cancel').should('be.enabled')

        // redis type cannot be changed
        cy.getTestId('redis-type-select').should('be.disabled')

        // CE fields
        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-keepalive-section').should('not.exist')
        cy.getTestId('redis-read-write-configuration-section').should('not.exist')
        cy.getTestId('redis-connection-is-proxied-checkbox').should('not.exist')
        cy.getTestId('redis-gcp_service_account_json-input').should('not.exist')
        cy.getTestId('redis-azure_client_id-input').should('not.exist')

        cy.getTestId('redis-name-input').should('be.visible').should('have.value', redisConfigurationCE.name)
        cy.getTestId('redis-host-input').should('be.visible').should('have.value', redisConfigurationCE.config.host)
        cy.getTestId('redis-port-input').should('be.visible').should('have.value', redisConfigurationCE.config.port)
        cy.getTestId('redis-timeout-input').should('be.visible').should('have.value', redisConfigurationCE.config.timeout)
        cy.getTestId('redis-database-input').should('be.visible').should('have.value', redisConfigurationCE.config.database)
        cy.getTestId('redis-ssl-checkbox').should('be.visible').should('not.be.checked')
        cy.getTestId('redis-ssl-verify-checkbox').should('be.visible').should('not.be.checked')
        cy.getTestId('redis-auth-provider-select').should('be.visible').should('have.value', 'AWS')
        cy.getTestId('redis-aws_cache_name-input').should('be.visible').should('have.value', redisConfigurationCE.config.cloud_authentication!.aws_cache_name)
        cy.getTestId('redis-aws_is_serverless-checkbox').should('be.visible').should('not.be.checked')

        // Host/Port EE
        interceptDetail({ body: redisConfigurationHostPortEE })

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationHostPortEE.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-type-select')
          .should('be.visible')
          .should('have.value', 'Host/Port')

        // an EE type can be changed to other EE types
        cy.getTestId('redis-type-select').should('not.be.disabled')

        // Host/port EE fields
        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')
        cy.getTestId('redis-gcp_service_account_json-input').should('not.exist')
        cy.getTestId('redis-azure_client_id-input').should('not.exist')

        cy.getTestId('redis-name-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.name)
        cy.getTestId('redis-host-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.host)
        cy.getTestId('redis-port-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.port)
        cy.getTestId('redis-database-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.database)
        cy.getTestId('redis-ssl-checkbox').should('be.visible').should(redisConfigurationHostPortEE.config.ssl ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-ssl-verify-checkbox').should('be.visible').should(redisConfigurationHostPortEE.config.ssl_verify ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-keepalive-backlog-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.keepalive_backlog)
        cy.getTestId('redis-keepalive-pool-size-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.keepalive_pool_size)
        cy.getTestId('redis-send-timeout-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.send_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.connect_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationHostPortEE.config.connect_timeout)
        cy.getTestId('redis-auth-provider-select').should('be.visible').should('have.value', 'AWS')
        cy.getTestId('redis-aws_cache_name-input').should('be.visible').should('have.value', redisConfigurationCE.config.cloud_authentication!.aws_cache_name)
        cy.getTestId('redis-aws_is_serverless-checkbox').should('be.visible').should('not.be.checked')

        // Cluster EE
        interceptDetail({ body: redisConfigurationCluster })

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCluster.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-type-select')
          .should('be.visible')
          .should('have.value', 'Cluster')

        // an EE type can be changed to other EE types
        cy.getTestId('redis-type-select').should('not.be.disabled')

        // Cluster fields
        cy.getTestId('redis-sentinel-configuration-section').should('not.exist')
        cy.getTestId('redis-host-input').should('not.exist')
        cy.getTestId('redis-port-input').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')
        cy.getTestId('redis-gcp_service_account_json-input').should('not.exist')
        cy.getTestId('redis-azure_client_id-input').should('not.exist')

        cy.getTestId('redis-name-input').should('be.visible').should('have.value', redisConfigurationCluster.name)
        cy.getTestId('redis-auth-provider-select').should('be.visible').should('have.value', 'AWS')
        cy.getTestId('redis-aws_cache_name-input').should('be.visible').should('have.value', redisConfigurationCE.config.cloud_authentication!.aws_cache_name)
        cy.getTestId('redis-aws_is_serverless-checkbox').should('be.visible').should('not.be.checked')

        // Cluster nodes
        cy.getTestId('redis-cluster-nodes')
          .should('be.visible')
          .find('.cluster-node-items')
          .should('have.length', redisConfigurationCluster.config.cluster_nodes!.length)

        cy.getTestId('redis-cluster-nodes')
          .find('input[name="ip"]').should('have.value', redisConfigurationCluster.config.cluster_nodes![0].ip)

        cy.getTestId('redis-cluster-nodes')
          .find('input[name="port"]').should('have.value', redisConfigurationCluster.config.cluster_nodes![0].port)

        // max redirections
        cy.getTestId('redis-cluster-max-redirections-input').should('be.visible').should('have.value', redisConfigurationCluster.config.cluster_max_redirections)

        cy.getTestId('redis-database-input').should('be.visible').should('have.value', redisConfigurationCluster.config.database)
        cy.getTestId('redis-ssl-checkbox').should('be.visible').should(redisConfigurationCluster.config.ssl ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-ssl-verify-checkbox').should('be.visible').should(redisConfigurationCluster.config.ssl_verify ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-keepalive-backlog-input').should('be.visible').should('have.value', redisConfigurationCluster.config.keepalive_backlog)
        cy.getTestId('redis-keepalive-pool-size-input').should('be.visible').should('have.value', redisConfigurationCluster.config.keepalive_pool_size)
        cy.getTestId('redis-send-timeout-input').should('be.visible').should('have.value', redisConfigurationCluster.config.send_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationCluster.config.connect_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationCluster.config.connect_timeout)

        // Sentinel EE
        interceptDetail({ body: redisConfigurationSentinel })

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationSentinel.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-type-select')
          .should('be.visible')
          .should('have.value', 'Sentinel')

        // an EE type can be changed to other EE types
        cy.getTestId('redis-type-select').should('not.be.disabled')

        // Sentinel fields
        cy.getTestId('redis-cluster-configuration-section').should('not.exist')
        cy.getTestId('redis-host-input').should('not.exist')
        cy.getTestId('redis-port-input').should('not.exist')
        cy.getTestId('redis-timeout-input').should('not.exist')

        cy.getTestId('redis-name-input').should('be.visible').should('have.value', redisConfigurationSentinel.name)
        cy.getTestId('redis-sentinel-master-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.sentinel_master)
        cy.getTestId('redis-sentinel-role-select').should('be.visible').should('have.attr', 'value', redisConfigurationSentinel.config.sentinel_role)
        cy.getTestId('redis-sentinel-master-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.sentinel_master)

        // Sentinel nodes
        cy.getTestId('redis-sentinel-nodes')
          .should('be.visible')
          .find('.sentinel-node-items')
          .should('have.length', redisConfigurationSentinel.config.sentinel_nodes!.length)

        cy.getTestId('redis-sentinel-nodes')
          .find('input[name="host"]').should('have.value', redisConfigurationSentinel.config.sentinel_nodes![0].host)

        cy.getTestId('redis-sentinel-nodes')
          .find('input[name="port"]').should('have.value', redisConfigurationSentinel.config.sentinel_nodes![0].port)

        cy.getTestId('redis-database-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.database)
        cy.getTestId('redis-ssl-checkbox').should('be.visible').should(redisConfigurationSentinel.config.ssl ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-ssl-verify-checkbox').should('be.visible').should(redisConfigurationSentinel.config.ssl_verify ? 'be.checked' : 'not.be.checked')
        cy.getTestId('redis-keepalive-backlog-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.keepalive_backlog)
        cy.getTestId('redis-keepalive-pool-size-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.keepalive_pool_size)
        cy.getTestId('redis-send-timeout-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.send_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.connect_timeout)
        cy.getTestId('redis-connect-timeout-input').should('be.visible').should('have.value', redisConfigurationSentinel.config.connect_timeout)
      })

      it('should correctly handle button state - edit', () => {
        stubCreateEdit()
        interceptLinkedPlugins()
        interceptDetail({ body: redisConfigurationCE })

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('partial-edit-form-submit').should('be.disabled')

        cy.getTestId('redis-host-input').type('1')

        cy.getTestId('partial-edit-form-submit')
          .should('be.enabled')
          .click()

        cy.wait('@editRedisConfiguration')

        cy.getTestId('partial-edit-form-submit').should('be.disabled')
      })

      it('should include cloud auth fields in request', () => {
        stubCreateEdit()
        interceptDetail()
        interceptLinkedPlugins()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-name-input').type('test')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.GCP}"]`)
          .click()

        cy.getTestId('partial-create-form-submit').click()

        cy.wait('@createRedisConfiguration').then(({ request }) => {
          const { body: { config } } = request
          expect(config.cloud_authentication.auth_provider).to.equal(AuthProvider.GCP)
        })
      })

      it('should set cloud auth fields to null when auth provider is not selected', () => {
        stubCreateEdit()
        interceptDetail()
        interceptLinkedPlugins()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
          },
        })

        cy.getTestId('redis-name-input').type('test')
        cy.getTestId('partial-create-form-submit').click()

        cy.wait('@createRedisConfiguration').then(({ request }) => {
          const { body: { config } } = request
          expect(config.cloud_authentication).to.equal(app === 'Konnect' ? undefined : null)
        })
      })

      it('should reset AWS fields when cloud auth provider is changed', () => {
        stubCreateEdit()
        interceptDetail()
        interceptLinkedPlugins()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-auth-provider-select').click()
        cy.getTestId('redis-auth-provider-select-popover')
          .find(`button[value="${AuthProvider.GCP}"]`)
          .click()

        cy.getTestId('partial-edit-form-submit').click()

        cy.wait('@editRedisConfiguration').then(({ request }) => {
          const { body: { config } } = request
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(config.cloud_authentication.aws_cache_name).to.not.exist
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(config.cloud_authentication.aws_region).to.not.exist
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(config.cloud_authentication.aws_is_serverless).to.not.exist
        })
      })

      it('should show error message', () => {
        interceptDetail({ status: 404 })
        interceptLinkedPlugins()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: 'invalid-id',
          },
        })

        cy.wait('@getRedisConfiguration')

        // error state is displayed
        cy.getTestId('form-fetch-error').should('be.visible')

        // buttons and form hidden
        cy.getTestId('route-edit-form-cancel').should('not.exist')
        cy.getTestId('route-edit-form-submit').should('not.exist')
        cy.get('.kong-ui-entities-route-form form').should('not.exist')
      })

      it('@update should be emitted when form is submitted', () => {
        stubCreateEdit()
        interceptDetail()
        interceptLinkedPlugins()

        // create
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            onUpdate: cy.stub().as('onCreateUpdateSpy'),
          },
        })

        cy.getTestId('redis-name-input').type('test')
        cy.getTestId('partial-create-form-submit').click()
        cy.wait('@createRedisConfiguration')
        cy.get('@onCreateUpdateSpy').should('have.been.calledOnce')

        // edit
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
            onUpdate: cy.stub().as('onEditUpdateSpy'),
          },
        })

        cy.wait('@getRedisConfiguration')
        cy.getTestId('redis-host-input').type('1')

        cy.getTestId('partial-edit-form-submit').click()

        cy.wait('@editRedisConfiguration')

        cy.get('@onEditUpdateSpy').should('have.been.calledOnce')
      })

      it('should show a warning when modifying a redis configuration that is in use by plugins', () => {
        interceptDetail({ body: redisConfigurationCE })
        interceptLinkedPlugins({ body: links })
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })

        cy.wait('@getRedisConfiguration')
        cy.wait('@getLinkedPlugins')

        cy.getTestId('redis-update-warning-alert').should('be.visible')

        cy.getTestId('redis-host-input').type('1')
        cy.getTestId('partial-edit-form-submit').click()

        cy.wait('@getLinkedPlugins')
        cy.getTestId('redis-update-warning-modal').find('.modal-container').should('be.visible')
        cy.getTestId('redis-update-warning-modal').find('[data-testid="modal-action-button"]').click()

        cy.wait('@editRedisConfiguration')

        interceptLinkedPlugins()
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })
        cy.wait('@getRedisConfiguration')
        cy.wait('@getLinkedPlugins')
        cy.getTestId('redis-update-warning-alert').should('not.exist')
      })

      it('props `slidoutTopOffset` should be working', () => {
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            slidoutTopOffset: 0,
          },
        })

        cy.getTestId('partial-create-form-view-configuration').click()
        cy.getTestId('slideout-container').should('be.visible').should('have.css', 'top', '0px')
      })

      it('props `actionTeleportTarget` should be working', () => {
        cy.document().then(doc => {
          const elem = doc.createElement('div')
          elem.id = 'test'
          doc.body.appendChild(elem)

          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              actionTeleportTarget: '#test',
            },
          })

          cy.get('#test')
            .should('be.visible')
            .findTestId('partial-create-form-view-configuration').should('be.visible')
        })
      })

      it('props `disabledPartialType` should be working', () => {
        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            disabledPartialType: PartialType.REDIS_CE,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_CE}"]`)
          .should('be.disabled')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
          .should('not.be.disabled')
          .should('have.class', 'selected')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.CLUSTER}"]`)
          .should('not.be.disabled')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.SENTINEL}"]`)
          .should('not.be.disabled')

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            disabledPartialType: PartialType.REDIS_EE,
          },
        })

        cy.getTestId('redis-type-select').click()
        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_CE}"]`)
          .should('not.be.disabled')
          .should('have.class', 'selected')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
          .should('be.disabled')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.CLUSTER}"]`)
          .should('be.disabled')

        cy.getTestId('redis-type-select-popover')
          .find(`button[value="${RedisType.SENTINEL}"]`)
          .should('be.disabled')
      })

      describe('fields do not belong to the selected type should be reset when editing', () => {
        it('Host/Port EE -> Cluster', () => {
          // Host/Port EE -> Cluster
          interceptDetail({ body: redisConfigurationHostPortEE })
          stubCreateEdit()
          interceptLinkedPlugins()

          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationHostPortEE.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.CLUSTER}"]`)
            .click()

          // Add cluster node
          cy.getTestId('redis-add-cluster-node-button').click()
          cy.getTestId('partial-edit-form-submit').click()

          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.host).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.port).to.not.exist
          })
        })

        it('Host/Port EE -> Sentinel', () => {
          // Host/Port EE -> Sentinel
          interceptDetail({ body: redisConfigurationHostPortEE })
          interceptLinkedPlugins()
          stubCreateEdit()
          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationHostPortEE.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.SENTINEL}"]`)
            .click()

          // Add sentinel node
          cy.getTestId('redis-add-sentinel-node-button').click()

          // Set sentinel master
          cy.getTestId('redis-sentinel-master-input').type('master')

          // Set sentinel role
          cy.getTestId('redis-sentinel-role-select').click()
          cy.getTestId('redis-sentinel-role-select-popover')
            .should('be.visible')
            .find('button:eq(0)')
            .click()

          cy.getTestId('partial-edit-form-submit').click()
          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.host).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.port).to.not.exist
          })
        })

        it('Cluster -> Host/Port EE', () => {
          // Cluster -> Host/Port EE
          interceptDetail({ body: redisConfigurationCluster })
          interceptLinkedPlugins()
          stubCreateEdit()
          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationCluster.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
            .click()

          cy.getTestId('redis-host-input').type('localhost')
          cy.getTestId('redis-port-input').clear().type('6379')

          cy.getTestId('partial-edit-form-submit').click()
          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.cluster_nodes).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.cluster_max_redirections).to.not.exist
          })
        })

        it('Cluster -> Sentinel', () => {
          // Cluster -> Sentinel
          interceptDetail({ body: redisConfigurationCluster })
          interceptLinkedPlugins()
          stubCreateEdit()
          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationCluster.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.SENTINEL}"]`)
            .click()

          // Add sentinel node
          cy.getTestId('redis-add-sentinel-node-button').click()

          // Set sentinel master
          cy.getTestId('redis-sentinel-master-input').type('master')

          // Set sentinel role
          cy.getTestId('redis-sentinel-role-select').click()
          cy.getTestId('redis-sentinel-role-select-popover')
            .should('be.visible')
            .find('button:eq(0)')
            .click()

          cy.getTestId('partial-edit-form-submit').click()
          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.cluster_nodes).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.cluster_max_redirections).to.not.exist
          })
        })

        it('Sentinel -> Host/Port EE', () => {
          // Sentinel -> Host/Port EE
          interceptDetail({ body: redisConfigurationSentinel })
          interceptLinkedPlugins()
          stubCreateEdit()
          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationSentinel.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.HOST_PORT_EE}"]`)
            .click()

          cy.getTestId('redis-host-input').type('localhost')
          cy.getTestId('redis-port-input').clear().type('6379')

          cy.getTestId('partial-edit-form-submit').click()
          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_master).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_role).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_nodes).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_username).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_password).to.not.exist
          })
        })

        it('Sentinel -> Cluster', () => {
          // Sentinel -> Cluster
          interceptDetail({ body: redisConfigurationSentinel })
          interceptLinkedPlugins()
          stubCreateEdit()
          cy.mount(RedisConfigurationForm, {
            props: {
              config,
              partialId: redisConfigurationSentinel.id,
            },
          })

          cy.wait('@getRedisConfiguration')

          cy.getTestId('redis-type-select').click()
          cy.getTestId('redis-type-select-popover')
            .find(`button[value="${RedisType.CLUSTER}"]`)
            .click()

          // Add cluster node
          cy.getTestId('redis-add-cluster-node-button').click()
          cy.getTestId('partial-edit-form-submit').click()

          cy.wait('@editRedisConfiguration').then(({ request }) => {
            const { body: { config } } = request
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_master).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_role).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_nodes).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_username).to.not.exist
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(config.sentinel_password).to.not.exist
          })
        })
      })

      it('`name` is immutable', () => {
        interceptDetail({ body: redisConfigurationCE })
        interceptLinkedPlugins()
        stubCreateEdit()

        cy.mount(RedisConfigurationForm, {
          props: {
            config,
            partialId: redisConfigurationCE.id,
          },
        })

        cy.wait('@getRedisConfiguration')

        cy.getTestId('redis-name-input').should('be.disabled')
      })

    })

  }
})
