import { ref, shallowRef } from 'vue'
import { FORMS_CONFIG } from '../../const'
import ServiceProtectionForm from './ServiceProtectionForm.vue'
import { REDIS_PARTIAL_INFO } from '../../const'
import { PLUGIN_FORM_FIELD_ERRORS } from '../../field-errors/context'
import schema from '../../../../../fixtures/schemas/service-protection'

import type { FieldError, FormSchema } from '@kong-ui-public/freeform'

/**
 * Covers the plugin-level wiring only: which fields Advanced renders, and the
 * render rules that place and toggle `config.redis`. The hide-and-prune
 * mechanism behind those rules is covered by the freeform component tests.
 */

// Rendered by RequestLimitsForm / ErrorMessageForm above, so never in Advanced
const PRIMARY_FIELDS = ['limit', 'window_size', 'window_type', 'error_code', 'error_message']

const redis = { host: 'redis.example.com', port: 6379 }

const partial = { id: 'redis-1', name: 'Shared Redis', type: 'redis-ee', config: { host: '127.0.0.1', port: 6379 } }

const mockPartials = () => {
  cy.intercept('GET', '**/partials?size=1000', { body: { data: [partial] } }).as('getPartials')
  cy.intercept('GET', `**/partials/${partial.id}`, { body: partial }).as('getPartial')
}

const mountForm = (
  config: Record<string, any>,
  { isEditing = false, fieldErrors }: { isEditing?: boolean, fieldErrors?: FieldError[] } = {},
) => {
  cy.mount(ServiceProtectionForm, {
    props: {
      schema: { type: 'record', ...schema } as unknown as FormSchema,
      model: { config: { limit: [10], window_size: [60], ...config } },
      isEditing,
      pluginName: 'service-protection',
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
          isEditing,
        },
        [FORMS_CONFIG]: {
          app: 'kongManager',
          workspace: 'default',
          apiBaseUrl: '/kong-manager',
        },
        ...(fieldErrors
          ? { [PLUGIN_FORM_FIELD_ERRORS as symbol]: { enabled: ref(true), errors: ref(fieldErrors), schema: shallowRef() } }
          : {}),
      },
    },
  })

  cy.getTestId('view-advanced').findTestId('collapse-trigger-content').click()
}

const lastFormChange = () => cy.get('@onFormChange').its('lastCall').its('args.0')

describe('<ServiceProtectionForm />', () => {
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

  for (const isEditing of [false, true]) {
    it(`clears a selected partial once the strategy leaves redis (${isEditing ? 'edit' : 'create'})`, () => {
      mockPartials()
      mountForm({ strategy: 'redis' }, { isEditing })

      cy.wait('@getPartials')
      // Editing an entry without a partial opens in dedicated mode
      cy.getTestId('shared-redis-config-radio').click()
      cy.getTestId('redis-config-select-trigger').click()
      cy.getTestId(`select-item-${partial.id}`).click()
      cy.wait('@getPartial')
      lastFormChange().its('partials').should('deep.equal', [{ id: partial.id }])

      cy.getTestId('ff-config.strategy').click()
      cy.getTestId('ff-enum-config.strategy-items').findTestId('select-item-local').click()

      // Editing PATCHes the plugin, so only `null` unlinks a stored partial
      lastFormChange().its('partials').should(isEditing ? 'be.null' : 'be.undefined')
    })
  }
  describe('errors on the request limits', () => {
    const fieldErrors: FieldError[] = [
      { path: 'config.limit.0', message: 'first limit' },
      { path: 'config.limit.2', message: 'third limit' },
      { path: 'config.window_size.2', message: 'third window' },
    ]

    it('moves the errors of the rows after a removed one along with them', () => {
      mountForm({ strategy: 'local', limit: [1, 2, 3], window_size: [60, 60, 60] }, { fieldErrors })
      cy.getTestId('ff-field-errors-config.limit.2').should('contain.text', 'third limit')

      cy.getTestId('sp-form-remove-limit-0').click()

      // The first row's error goes with it; the third row's errors are now the second row's
      cy.getTestId('ff-config.limit.2').should('not.exist')
      cy.getTestId('ff-field-errors-config.limit.0').should('not.exist')
      cy.getTestId('ff-field-errors-config.limit.1').should('have.text', 'third limit')
      cy.getTestId('ff-field-errors-config.window_size.1').should('have.text', 'third window')
    })

    it('moves the errors of the rows after an inserted one along with them', () => {
      mountForm({ strategy: 'local', limit: [1, 2, 3], window_size: [60, 60, 60] }, { fieldErrors })
      cy.getTestId('ff-field-errors-config.limit.2').should('contain.text', 'third limit')

      // Inserts a row after the first one
      cy.getTestId('sp-form-add-limit-0').click()

      cy.getTestId('ff-config.limit.3').should('exist')
      cy.getTestId('ff-field-errors-config.limit.0').should('have.text', 'first limit')
      cy.getTestId('ff-field-errors-config.limit.1').should('not.exist')
      cy.getTestId('ff-field-errors-config.limit.2').should('not.exist')
      cy.getTestId('ff-field-errors-config.limit.3').should('have.text', 'third limit')
      cy.getTestId('ff-field-errors-config.window_size.3').should('have.text', 'third window')
    })

    it('shows the errors of the whole arrays below the rows and links to them', () => {
      mountForm({ strategy: 'local', limit: [], window_size: [] }, {
        fieldErrors: [
          { path: 'config.limit', message: 'length must be at least 1' },
          { path: 'config.window_size', message: 'length must be at least 1' },
        ],
      })

      // No limit yet, so one empty row shows
      cy.getTestId('ff-config.limit.0').should('exist')
      cy.getTestId('ff-field-errors-config.limit').should('have.text', 'length must be at least 1')
      cy.getTestId('ff-field-errors-config.window_size').should('have.text', 'length must be at least 1')
      cy.getTestId('ff-error-summary-item-config.window_size').find('.ff-error-summary-link').click()
      cy.getTestId('ff-config.limit.0').should('have.focus')
    })

    it('leaves the errors of the items to their rows', () => {
      mountForm({ strategy: 'local' }, { fieldErrors: [{ path: 'config.limit.0', message: 'invalid limit' }] })

      cy.getTestId('ff-field-errors-config.limit.0').should('have.text', 'invalid limit')
      cy.getTestId('ff-field-errors-config.limit').should('not.exist')
    })
  })
})
