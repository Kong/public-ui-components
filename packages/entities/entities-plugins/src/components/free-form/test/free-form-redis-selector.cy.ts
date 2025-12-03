import Form from '../shared/Form.vue'
import type { FormSchema } from '../../../types/plugins/form-schema'
import type { RenderRules } from '../shared/types'
import { REDIS_PARTIAL_INFO } from '../shared/const'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { ref } from 'vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import RedisSelector from '../shared/RedisSelector.vue'
import { FIELD_RENDERERS } from '../shared/composables'

const createDefaultRedisConfig = () => ({
  host: '0.0.0.0',
  port: 6379,
})

// Helper function to create simple Redis schema for testing
const createRedisSchema = (): FormSchema => {
  const defaultValue = createDefaultRedisConfig()
  return {
    type: 'record',
    supported_partials: { 'redis-ce': ['config.redis'] },
    fields: [{
      config: {
        type: 'record',
        required: true,
        fields: [{
          redis: {
            type: 'record',
            required: true,
            fields: [
              { host: { type: 'string', default: defaultValue.host } },
              { port: { type: 'number', default: defaultValue.port } },
            ],
          },
        }],
      },
    }],
  }
}

// Helper function to create schema with dependency for renderRules testing
const createRedisSchemaWithDependency = (): FormSchema => {
  const defaultValue = createDefaultRedisConfig()
  return {
    type: 'record',
    supported_partials: { 'redis-ce': ['config.redis'] },
    fields: [
      {
        config: {
          type: 'record',
          required: true,
          fields: [{
            enable_redis: {
              type: 'boolean',
              default: true,
            },
          }, {
            redis: {
              type: 'record',
              required: true,
              fields: [
                { host: { type: 'string', default: defaultValue.host } },
                { port: { type: 'number', default: defaultValue.port } },
              ],
            },
          }],
        },
      },
    ],
  }
}

// Helper function to create renderRules for dependency testing
const createRenderRules = (): RenderRules => ({
  dependencies: {
    'config.redis': ['config.enable_redis', true],
  },
})
// Helper function to create Konnect config for testing
const createKonnectConfig = () => ({
  app: 'konnect' as const,
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: '123',
})

// Helper function to create Redis partial info
const createRedisPartialInfo = (isEditing = false) => ({
  isEditing,
  redisType: ref('redis-ce' as const),
  redisPath: ref('config.redis'),
})

const verifyFieldVisibility = ({
  hiddenFields = [],
  visibleFields = [],
}: {
  hiddenFields?: string[]
  visibleFields?: string[]
}) => {
  hiddenFields.forEach(((fieldName) => {
    const testId = `ff-config.redis.cloud_authentication.${fieldName}`
    cy.get(`[data-testid="${testId}"]`).then(($fields) => {
      const element = $fields.toArray()[0]
      const offsetParent = element?.offsetParent
      cy.log(`${fieldName} offsetParent:`, offsetParent)
      expect(offsetParent).to.equal(null)
    })
  }))

  visibleFields.forEach(((fieldName) => {
    const testId = `ff-config.redis.cloud_authentication.${fieldName}`
    cy.get(`[data-testid="${testId}"]`).should('be.visible')
  }))
}

// Helper function to mount the form with RedisSelector
const mountForm = (options?: { renderRules?: RenderRules, isEditing?: boolean, schema?: FormSchema }) => {
  const schema = options?.schema ?? (options?.renderRules ? createRedisSchemaWithDependency() : createRedisSchema())
  const redisPartialInfo = createRedisPartialInfo(options?.isEditing ?? false)
  const onChangeSpy = cy.spy().as('onChangeSpy')

  cy.mount(Form, {
    props: {
      schema,
      renderRules: options?.renderRules,
      onChange: onChangeSpy,
    },
    slots: {
      [FIELD_RENDERERS]: `
        <FieldRenderer :match="({ path }) => path === 'config.redis'">
          <RedisSelector />
        </FieldRenderer>
      `,
    },
    global: {
      provide: {
        [REDIS_PARTIAL_INFO as symbol]: redisPartialInfo,
        [FORMS_CONFIG]: createKonnectConfig(),
      },
      components: {
        FieldRenderer,
        RedisSelector,
      },
    },
  })
}

const getMockRedisConfigResponse = () => {
  const single = {
    id: 'redis-1',
    name: 'Test Redis Config',
    type: 'redis-ce',
    config: {
      host: '127.0.0.1',
      port: 6379,
    },
    created_at: 1697059200,
    updated_at: 1697059200,
  }
  return {
    list: {
      data: [single],
    },
    single,
  }
}

// Helper function to mock get redis config API
const mockGetRedisConfig = () => {
  const { list, single } = getMockRedisConfigResponse()
  cy.intercept(
    'GET',
    '**/core-entities/partials?size=1000',
    {
      statusCode: 200,
      body: list,
    },
  ).as('getRedisConfigList')

  cy.intercept(
    'GET',
    '**/core-entities/partials/redis-1',
    {
      statusCode: 200,
      body: single,
    },
  ).as('getRedisConfig')
}

describe('RedisSelector', () => {
  describe('Create Mode', () => {
    describe('Basic Rendering Test', () => {
      it('Renders Redis Config Card', () => {
        mockGetRedisConfig()
        mountForm()

        cy.getTestId('redis-config-card').should('exist')

        cy.getTestId('shared-redis-config-radio')
          .should('exist')
          .should('be.visible')
          .should('have.attr', 'checked')

        cy.getTestId('dedicated-redis-config-radio')
          .should('exist')
          .should('be.visible')
          .should('not.have.attr', 'checked')
      })
    })

    describe('Shared Mode Functionality', () => {
      it('Choose partial config and update partials field', () => {
        mockGetRedisConfig()
        mountForm()

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // In Shared mode, select config 'redis-1'
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        // Wait for get config detail API
        cy.wait('@getRedisConfig')

        // Verify onChange is called and partials field is updated
        cy.get('@onChangeSpy').should('have.been.called')
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args).to.have.property('partials')
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })
        cy.get('@onChangeSpy').its('lastCall.args.0.config.redis').should('be.undefined')

        // Verify RedisConfigCard displays config details
        cy.get('.partial-config-card').should('exist')
      })
    })

    describe('Dedicated Mode Functionality', () => {
      it('Fill in dedicated config and update config field', () => {
        mockGetRedisConfig()
        mountForm()

        cy.getTestId('dedicated-redis-config-radio').click()

        cy.getTestId('ff-config.redis.port').clear()
        cy.getTestId('ff-config.redis.port').type('1234')

        // Verify onChange is called and config.redis is updated
        cy.get('@onChangeSpy').should('have.been.called')
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis.port).to.equal(1234)
        })
      })
    })

    describe('Switching Modes', () => {
      it('Switches from Shared to Dedicated mode', () => {
        mockGetRedisConfig()
        mountForm()

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Choose partial config first
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        // Switch to Dedicated mode
        cy.getTestId('dedicated-redis-config-radio').click()

        // Verify onChange is called and config.redis is updated
        cy.get('@onChangeSpy').should('have.been.called')
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal(createDefaultRedisConfig())
        })
      })

      it('Switches from Dedicated to Shared mode', () => {
        mockGetRedisConfig()
        mountForm()

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Switch to Dedicated mode first
        cy.getTestId('dedicated-redis-config-radio').click()

        // Fill in host and port
        cy.getTestId('ff-config.redis.host').clear()
        cy.getTestId('ff-config.redis.host').type('localhost')
        cy.getTestId('ff-config.redis.port').clear()
        cy.getTestId('ff-config.redis.port').type('6379')

        // Verify form data
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal({ host: 'localhost', port: 6379 })
        })
        cy.get('@onChangeSpy').its('lastCall.args.0.partials').should('be.undefined')

        // Switch to Shared mode
        cy.getTestId('shared-redis-config-radio').click()
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })
        cy.get('@onChangeSpy').its('lastCall.args.0.config.redis').should('be.undefined')

        // Switch back to Dedicated mode
        cy.getTestId('dedicated-redis-config-radio').click()

        // Verify form data is restored
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal({ host: 'localhost', port: 6379 })
        })
        cy.get('@onChangeSpy').its('lastCall.args.0.partials').should('be.undefined')

        // Verify field values are still displayed
        cy.getTestId('ff-config.redis.host').should('have.value', 'localhost')
        cy.getTestId('ff-config.redis.port').should('have.value', '6379')
      })
    })

    describe('RenderRules Dependency Handling', () => {
      it('Clears partials when field is hidden in Shared mode', () => {
        mockGetRedisConfig()
        mountForm({ renderRules: createRenderRules() })

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Set enable_redis to true, redis field is visible
        cy.getTestId('ff-config.enable_redis').check()

        // In Shared mode, select config 'redis-1'
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        // Wait for get config detail API
        cy.wait('@getRedisConfig')

        // Verify partials is set
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })

        // Set enable_redis to false, trigger redis field to hide
        cy.getTestId('ff-config.enable_redis').uncheck()

        // Verify partials is cleared to undefined (create mode)
        cy.get('@onChangeSpy').its('lastCall.args.0.partials').should('be.undefined')
      })

      it('Restores partials when field is shown again in Shared mode', () => {
        mockGetRedisConfig()
        mountForm({ renderRules: createRenderRules() })

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Set enable_redis to true, redis field is visible
        cy.getTestId('ff-config.enable_redis').check()

        // In Shared mode, select config 'redis-1'
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        // Wait for get config detail API
        cy.wait('@getRedisConfig')

        // Verify partials is set
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })

        // Set enable_redis to false, trigger redis field to hide
        cy.getTestId('ff-config.enable_redis').uncheck()

        // Verify partials is cleared
        cy.get('@onChangeSpy').its('lastCall.args.0.partials').should('be.undefined')

        // Redis should be default values, because it is required field
        cy.get('@onChangeSpy').its('lastCall.args.0.config.redis').should('deep.equal', createDefaultRedisConfig())

        // Set enable_redis to true again, field is shown again
        cy.getTestId('ff-config.enable_redis').check()

        // Verify partials is restored
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })
        cy.get('@onChangeSpy').its('lastCall.args.0.config.redis').should('be.undefined')
      })

      it('Hides redis field when dependency condition is not met in Dedicated mode', () => {
        mockGetRedisConfig()
        mountForm({ renderRules: createRenderRules() })

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Switch to Dedicated mode
        cy.getTestId('dedicated-redis-config-radio').click()

        // Set enable_redis to true
        cy.getTestId('ff-config.enable_redis').check()

        // Fill in host and port
        cy.getTestId('ff-config.redis.host').clear()
        cy.getTestId('ff-config.redis.host').type('localhost')
        cy.getTestId('ff-config.redis.port').clear()
        cy.getTestId('ff-config.redis.port').type('6379')

        // Verify form data
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal({ host: 'localhost', port: 6379 })
        })

        // Set enable_redis to false
        cy.getTestId('ff-config.enable_redis').uncheck()

        // Verify redis value is reset to default (create mode)
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal(createDefaultRedisConfig())
        })
      })

      it('Restores redis values when field is shown again in Dedicated mode', () => {
        mockGetRedisConfig()
        mountForm({ renderRules: createRenderRules() })

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        // Switch to Dedicated mode
        cy.getTestId('dedicated-redis-config-radio').click()

        // Set enable_redis to true
        cy.getTestId('ff-config.enable_redis').check()

        // Fill in host and port
        cy.getTestId('ff-config.redis.host').clear()
        cy.getTestId('ff-config.redis.host').type('localhost')
        cy.getTestId('ff-config.redis.port').clear()
        cy.getTestId('ff-config.redis.port').type('6379')

        // Verify form data
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal({ host: 'localhost', port: 6379 })
        })

        // Set enable_redis to false
        cy.getTestId('ff-config.enable_redis').uncheck()

        // Verify redis value is reset to default
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal(createDefaultRedisConfig())
        })

        // Set enable_redis to true again, field is shown again
        cy.getTestId('ff-config.enable_redis').check()

        // Verify redis values are restored (component caches the state)
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.config?.redis).to.deep.equal({ host: 'localhost', port: 6379 })
        })

        // Verify field values are still displayed
        cy.getTestId('ff-config.redis.host').should('have.value', 'localhost')
        cy.getTestId('ff-config.redis.port').should('have.value', '6379')
      })
    })

    describe('Auth Provider Dependency Handling', () => {
      it('Handles visibility of fields based on auth provider selection', () => {
        const schema: FormSchema = {
          type: 'record',
          supported_partials: { 'redis-ce': ['config.redis'] },
          fields: [{
            config: {
              type: 'record',
              required: true,
              fields: [{
                redis: {
                  type: 'record',
                  required: true,
                  fields: [
                    {
                      cloud_authentication: {
                        required: true, // make it required to expand the fields by default
                        type: 'record',
                        fields: [
                          { auth_provider: { type: 'string', one_of: ['aws', 'gcp', 'azure'] } },
                          { aws_cache_name: { type: 'string' } },
                          { aws_region: { type: 'string' } },
                          { aws_is_serverless: { type: 'boolean', default: true } },
                          { aws_access_key_id: { type: 'string' } },
                          { aws_secret_access_key: { type: 'string' } },
                          { aws_assume_role_arn: { type: 'string' } },
                          { aws_role_session_name: { type: 'string' } },
                          { gcp_service_account_json: { type: 'string' } },
                          { azure_client_id: { type: 'string' } },
                          { azure_client_secret: { type: 'string' } },
                          { azure_tenant_id: { type: 'string' } },
                        ],
                      },
                    }],
                },
              }],
            },
          }],
        }

        mountForm({ schema })

        // Select Dedicated mode
        cy.getTestId('dedicated-redis-config-radio').click()

        // All other fields are hidden by default
        verifyFieldVisibility({
          hiddenFields: [
            'aws_cache_name',
            'aws_region',
            'aws_is_serverless',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_assume_role_arn',
            'aws_role_session_name',
            'gcp_service_account_json',
            'azure_client_id',
            'azure_client_secret',
            'azure_tenant_id',
          ],
        })

        // Select AWS auth provider
        cy.getTestId('ff-config.redis.cloud_authentication.auth_provider').click()
        cy.getTestId('select-item-aws').click()

        verifyFieldVisibility({
          visibleFields: [
            'aws_cache_name',
            'aws_region',
            'aws_is_serverless',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_assume_role_arn',
            'aws_role_session_name',
          ],
          hiddenFields: [
            'gcp_service_account_json',
            'azure_client_id',
            'azure_client_secret',
            'azure_tenant_id',
          ],
        })

        // Select GCP auth provider
        cy.getTestId('ff-config.redis.cloud_authentication.auth_provider').click()
        cy.getTestId('select-item-gcp').click()

        verifyFieldVisibility({
          visibleFields: [
            'gcp_service_account_json',
          ],
          hiddenFields: [
            'aws_cache_name',
            'aws_region',
            'aws_is_serverless',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_assume_role_arn',
            'aws_role_session_name',
            'azure_client_id',
            'azure_client_secret',
            'azure_tenant_id',
          ],
        })

        // Select Azure auth provider
        cy.getTestId('ff-config.redis.cloud_authentication.auth_provider').click()
        cy.getTestId('select-item-azure').click()

        verifyFieldVisibility({
          visibleFields: [
            'azure_client_id',
            'azure_client_secret',
            'azure_tenant_id',
          ],
          hiddenFields: [
            'gcp_service_account_json',
            'aws_cache_name',
            'aws_region',
            'aws_is_serverless',
            'aws_access_key_id',
            'aws_secret_access_key',
            'aws_assume_role_arn',
            'aws_role_session_name',
          ],
        })
      })
    })
  })

  describe('Edit Mode', () => {
    describe('RenderRules Dependency Handling', () => {
      it('Clears partials with null when field is hidden in Shared mode (edit mode)', () => {
        mockGetRedisConfig()
        mountForm({ renderRules: createRenderRules(), isEditing: true })

        // Wait for API call to complete
        cy.wait('@getRedisConfigList')

        cy.getTestId('shared-redis-config-radio').click()

        // Set enable_redis to true, redis field is visible
        cy.getTestId('ff-config.enable_redis').check()

        // In Shared mode, select config 'redis-1'
        cy.getTestId('redis-config-select-trigger').click()
        cy.getTestId('select-item-redis-1').click()

        // Verify partials is set
        cy.get('@onChangeSpy').its('lastCall.args.0').should((args: any) => {
          expect(args.partials).to.deep.equal([{ id: getMockRedisConfigResponse().single.id }])
        })

        // Set enable_redis to false, trigger field to hide
        cy.getTestId('ff-config.enable_redis').uncheck()

        // Verify partials is cleared to null (edit mode, not undefined)
        cy.get('@onChangeSpy').then((spy) => {
          const lastCall = (spy as any).lastCall
          expect(lastCall.args[0].partials).to.equal(null)
        })
      })
    })
  })
})
