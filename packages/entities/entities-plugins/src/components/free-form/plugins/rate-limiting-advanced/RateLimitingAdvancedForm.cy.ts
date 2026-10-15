import { ref } from 'vue'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import RateLimitingAdvancedForm from './RateLimitingAdvancedForm.vue'
import { REDIS_PARTIAL_INFO } from '../../const'
import schema from '../../../../../fixtures/schemas/rate-limiting-advanced'

import type { FormSchema } from '@kong-ui-public/freeform'

/**
 * Covers the plugin-level wiring only: which fields Advanced renders, the
 * field renderers, and the render rules that place and toggle `config.redis`.
 * The hide-and-prune mechanism behind those rules is covered by the freeform
 * component tests.
 */

// Rendered by hand above Advanced, so never in it
const PRIMARY_FIELDS = ['custom_key', 'identifier', 'limit', 'window_size', 'window_type', 'error_code', 'error_message']

const redis = { host: 'redis.example.com', port: 6379 }

const mountForm = (config: Record<string, any>) => {
  cy.mount(RateLimitingAdvancedForm, {
    props: {
      schema: { type: 'record', ...schema } as unknown as FormSchema,
      formSchema: { fields: [] },
      formModel: {},
      model: { config: { identifier: 'consumer', limit: [10], window_size: [60], ...config } },
      isEditing: false,
      pluginName: 'rate-limiting-advanced',
      onFormChange: cy.spy().as('onFormChange'),
    },
    global: {
      // PluginForm.vue always provides REDIS_PARTIAL_INFO; the fixture declares
      // `supported_partials: { 'redis-ee': ['config.redis'] }`. FORMS_CONFIG is
      // required by RedisConfigurationSelector inside RedisSelector.
      provide: {
        [REDIS_PARTIAL_INFO as symbol]: {
          redisType: ref('redis-ee'),
          redisPath: ref('config.redis'),
          isEditing: false,
        },
        [FORMS_CONFIG]: {
          app: 'kongManager',
          workspace: 'default',
          apiBaseUrl: '/kong-manager',
        },
      },
    },
  })

  cy.getTestId('view-advanced').findTestId('collapse-trigger-content').click()
}

const lastFormChange = () => cy.get('@onFormChange').its('lastCall').its('args.0')

describe('<RateLimitingAdvancedForm />', () => {
  it('renders config.compound_identifier as one multiselect', () => {
    mountForm({ strategy: 'local' })

    // The schema types it as an array; without its renderer it falls back to
    // ArrayField, one select per item
    cy.getTestId('ff-config.compound_identifier').should('have.length', 1).and('have.class', 'multiselect-trigger')
    cy.getTestId('ff-array-config.compound_identifier').should('not.exist')
  })

  it('renders the redis settings right under the strategy', () => {
    mountForm({ strategy: 'redis', redis })

    cy.getTestId('view-advanced').then(($advanced) => {
      // Top-level config fields plus the redis card, in document order
      const order = [...$advanced[0].querySelectorAll('[data-testid]')]
        .map(el => el.getAttribute('data-testid')!)
        .filter(id => /^ff-(object-)?config\.[a-z_]+$/.test(id) || id === 'redis-config-card')

      expect(order[order.indexOf('ff-config.strategy') + 1]).to.equal('redis-config-card')
    })
  })

  it('keeps the hand-rendered fields out of Advanced', () => {
    mountForm({ strategy: 'local' })

    for (const name of PRIMARY_FIELDS) {
      cy.get(`[data-testid^="ff-config.${name}"], [data-testid^="ff-radio-config.${name}-"]`).should('exist')
      cy.getTestId('view-advanced')
        .find(`[data-testid^="ff-config.${name}"], [data-testid^="ff-radio-config.${name}-"]`)
        .should('not.exist')
    }
  })

  it('shows config.redis and keeps it in the payload when the strategy is redis', () => {
    mountForm({ strategy: 'redis', redis })

    cy.getTestId('redis-config-card').should('be.visible')
    lastFormChange().its('config.redis').should('deep.include', redis)
  })

  it('hides config.redis and drops the entered values from the payload when the strategy is not redis', () => {
    mountForm({ strategy: 'local', redis })

    cy.getTestId('redis-config-card').should('not.be.visible')
    // `config.redis` is required, so a hidden one resets to its schema defaults rather than null
    lastFormChange().its('config.redis.host').should('not.equal', redis.host)
  })
})
