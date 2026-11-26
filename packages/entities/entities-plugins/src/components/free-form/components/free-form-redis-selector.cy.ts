import { Field, Form, FieldRenderer, FIELD_RENDERERS } from '@kong-ui-public/freeform'
import type { FieldError, FormSchema, RenderRules, RevealResult } from '@kong-ui-public/freeform'
import { REDIS_PARTIAL_INFO } from '../const'
import { FORMS_CONFIG } from '../const'
import { ref } from 'vue'
import RedisSelector from './RedisSelector.vue'

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

/** `partials` is a field of the plugin entity: the plugin form adds it to the schema (see `StandardLayout`) */
const withPartials = (schema: FormSchema): FormSchema => ({
  ...schema,
  fields: [
    ...schema.fields,
    {
      partials: {
        type: 'array',
        elements: { type: 'record', fields: [{ id: { type: 'string' } }, { name: { type: 'string' } }, { path: { type: 'string' } }] },
      },
    },
  ],
})

/** What the tests need from the form's exposed API */
type RevealingForm = {
  reveal: (path: string) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
}

const reveal = (path: string) => cy.get<RevealingForm>('@form').then(form => cy.wrap(form.reveal(path)))

// Helper function to mount the form with RedisSelector
const mountForm = (options?: {
  renderRules?: RenderRules
  isEditing?: boolean
  schema?: FormSchema
  data?: Record<string, any>
  errors?: FieldError[]
  borderless?: boolean
}) => {
  const schema = options?.schema ?? (options?.renderRules ? createRedisSchemaWithDependency() : createRedisSchema())
  const redisPartialInfo = createRedisPartialInfo(options?.isEditing ?? false)
  const onChangeSpy = cy.spy().as('onChangeSpy')

  cy.mount(Form, {
    props: {
      schema,
      data: options?.data,
      errors: options?.errors,
      renderRules: options?.renderRules,
      onChange: onChangeSpy,
    },
    slots: {
      [FIELD_RENDERERS]: `
        <FieldRenderer :match="({ path }) => path === 'config.redis'">
          <RedisSelector${options?.borderless ? ' borderless' : ''} />
        </FieldRenderer>
      `,
      // Like the plugin form, which renders `partials` only through RedisSelector
      ...(options?.errors && { default: '<Field name="config" />' }),
    },
    global: {
      provide: {
        [REDIS_PARTIAL_INFO as symbol]: redisPartialInfo,
        [FORMS_CONFIG]: createKonnectConfig(),
      },
      components: {
        Field,
        FieldRenderer,
        RedisSelector,
      },
    },
  }).then(({ wrapper }) => {
    cy.wrap(wrapper.vm as unknown as RevealingForm).as('form')
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

  describe('Field errors', () => {
    const partialNotFound = 'partial with ID "redis-1" not found'

    it('shows an error on the partial on the partial selector', () => {
      mockGetRedisConfig()
      mountForm({
        isEditing: true,
        schema: withPartials(createRedisSchema()),
        data: { config: { redis: null }, partials: [{ id: 'redis-1' }] },
        errors: [{ path: 'partials.0.id', message: partialNotFound }],
      })
      cy.wait('@getRedisConfig')

      cy.getTestId('redis-config-select').should('contain.text', partialNotFound)
      cy.get<RevealingForm>('@form').its('unmatchedErrors').should('have.length', 0)
      reveal('partials.0.id').should('deep.equal', { path: 'partials', exact: false })
    })

    it('lands a reveal of a dedicated field on the card in shared mode, keeping the data', () => {
      mockGetRedisConfig()
      mountForm({
        schema: withPartials(createRedisSchema()),
        errors: [{ path: 'config.redis.host', message: 'required field missing' }],
      })
      cy.wait('@getRedisConfigList')
      cy.getTestId('shared-redis-config-radio').should('have.attr', 'checked')

      // Switching to dedicated mode would change the data (`partials`, `config.redis`),
      // and a reveal only changes the view: it stops at the card, where the user picks the mode
      reveal('config.redis.host').should('deep.equal', { path: 'config.redis', exact: false })
      cy.getTestId('shared-redis-config-radio').should('have.attr', 'checked')
      cy.getTestId('ff-config.redis.host').should('not.exist')
    })

    it('shows the errors of the Redis record itself in the borderless variant', () => {
      mockGetRedisConfig()
      mountForm({
        borderless: true,
        schema: withPartials(createRedisSchema()),
        errors: [{ path: 'config.redis', message: 'redis is invalid' }],
      })
      cy.wait('@getRedisConfigList')

      cy.getTestId('redis-config-card').find('[data-testid="ff-field-errors-config.redis"]:visible')
        .should('have.length', 1)
        .and('have.text', 'redis is invalid')
      cy.getTestId('dedicated-redis-config-radio').click()
      cy.getTestId('redis-config-card').find('[data-testid="ff-field-errors-config.redis"]:visible')
        .should('have.length', 1)
        .and('have.text', 'redis is invalid')
    })

    it('shows the errors of the Redis record itself once', () => {
      mockGetRedisConfig()
      mountForm({
        schema: withPartials(createRedisSchema()),
        errors: [{ path: 'config.redis', message: 'redis is invalid' }],
      })
      cy.wait('@getRedisConfigList')

      cy.getTestId('redis-config-card').find('[data-testid="ff-field-errors-config.redis"]:visible').should('have.length', 1)
      cy.getTestId('dedicated-redis-config-radio').click()
      cy.getTestId('redis-config-card').find('[data-testid="ff-field-errors-config.redis"]:visible').should('have.length', 1)
    })
  })
})
