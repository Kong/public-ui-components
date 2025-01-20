import { h } from 'vue'
import type {
  KonnectBaseEntityConfig,
  ConfigurationSchema,
  PluginConfigurationSchema,
} from '../../types'
import { ConfigurationSchemaSection, SupportedEntityType } from '../../types'
import { gatewayServiceRecord, pluginRecord, emptyKey, keyWithValue } from '../../../fixtures/mockData'
import composables from '../../composables'
import EntityBaseConfigCard from './EntityBaseConfigCard.vue'

const { convertKeyToTitle } = composables.useStringHelpers()

const controlPlaneId = '1234-abcd-ilove-cats-too'
const entityId = '1234-cats-rule'
const config: KonnectBaseEntityConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  entityId,
}
const fetchUrl = `/v2/control-planes/${config.controlPlaneId}/core-entities/services/{id}`
const pluginsFetchUrl = `/v2/control-planes/${config.controlPlaneId}/core-entities/plugins/{id}`
const pluginConfigKey = 'config'
const entityType = SupportedEntityType.Plugin

const customizedKey = 'ca_certificates'
const customTooltip = 'Custom tooltip'
const customLabel = 'CA Certificates'
const unconfiguredKey = 'client_certificate'
const configSchema: ConfigurationSchema = {
  protocol: {
    section: ConfigurationSchemaSection.Basic,
  },
  host: {
    section: ConfigurationSchemaSection.Basic,
  },
  path: {
    section: ConfigurationSchemaSection.Basic,
  },
  port: {
    section: ConfigurationSchemaSection.Basic,
  },
  retries: {
    order: 1,
    // this key MUST be in the advanced section for tests
    section: ConfigurationSchemaSection.Advanced,
  },
  connect_timeout: {
    order: 2,
    // this key MUST be in the advanced section for tests
    section: ConfigurationSchemaSection.Advanced,
  },
  write_timeout: {
    order: 3,
    // this key MUST be in the advanced section for tests
    section: ConfigurationSchemaSection.Advanced,
  },
  read_timeout: {
    order: 4,
    // this key MUST be in the advanced section for tests
    section: ConfigurationSchemaSection.Advanced,
  },
  [customizedKey]: {
    label: customLabel,
    tooltip: customTooltip,
    order: 6,
    section: ConfigurationSchemaSection.Advanced,
  },
  [unconfiguredKey]: {
    // leave this object empty for tests!!
  },
  tls_verify: {
    order: 6,
    section: ConfigurationSchemaSection.Advanced,
  },
  tls_verify_depth: {
    hidden: true, // do not change this value
  },
}

const pluginConfigSchema: PluginConfigurationSchema = {
  account_email: {
    order: 1,
  },
  api_uri: {
    order: 2,
  },
  cert_type: {
    order: 3,
  },
}

describe('<EntityBaseConfigCard />', () => {
  const interceptFetch = (status = 200): void => {
    cy.intercept(
      {
        method: 'GET',
        url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/services/${entityId}`,
      },
      {
        statusCode: status,
        body: gatewayServiceRecord,
      },
    ).as('fetchRecord')
  }

  const interceptPluginFetch = (status = 200): void => {
    cy.intercept(
      {
        method: 'GET',
        url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/plugins/${entityId}`,
      },
      {
        statusCode: status,
        body: pluginRecord,
      },
    ).as('fetchPluginRecord')
  }

  describe('General', () => {
    it('hides title content when `hideTitle` prop is set', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
          hideTitle: true,
        },
      })

      cy.getTestId('config-card-title').should('not.exist')
    })

    it('displays KSelect to choose Format', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.getTestId('select-config-format').should('exist')
    })

    it('displays KButton with book icon when `configCardDoc` prop is set correctly', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
          configCardDoc: 'www.test.com',
        },
      })

      cy.getTestId('book-icon').should('exist')
    })

    it('correctly displays common fields', () => {
      const commonFields = ['id', 'name', 'enabled', 'updated_at', 'created_at', 'tags']
      const commonLabels = ['ID', 'Name', 'Enabled', 'Last Updated', 'Created', 'Tags']

      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      commonFields.forEach((field: string, idx: number) => {
        // in basic section
        cy.get(`[data-testid="config-card-details-basic-props"] [data-testid="${field}-label"]`).should('exist')
        if (idx !== 5) {
          // displayed in correct order, with correct label
          cy.get('[data-testid="config-card-details-basic-props"] .config-card-details-row').eq(idx).should('contain.text', commonLabels[idx])
        } else {
          // displayed in correct order, with correct label
          cy.get('[data-testid="config-card-details-basic-props"] .config-card-details-row').last().should('contain.text', commonLabels[idx])
        }
      })

      // correct default types
      cy.getTestId(`${commonFields[0]}-copy-uuid`).should('be.visible')
      cy.getTestId(`${commonFields[2]}-badge-status`).should('be.visible')
      cy.getTestId(`${commonFields[3]}-date`).should('be.visible')
      cy.getTestId(`${commonFields[4]}-date`).should('be.visible')
      cy.getTestId(`${commonFields[5]}-badge-tags`).should('be.visible')
    })

    it('correctly applies the default values to properties without explicit configurations', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      // section defaults to Advanced (and hidden defaults to false)
      cy.get(`[data-testid="config-card-details-advanced-props"] [data-testid="${unconfiguredKey}-label"]`).should('exist')
      // title cases key for the label
      cy.getTestId(`${unconfiguredKey}-label`).should('contain.text', convertKeyToTitle(unconfiguredKey))
      // no tooltip
      cy.getTestId(`${unconfiguredKey}-label-tooltip`).should('not.exist')
      // type defaults to plain text
      cy.getTestId(`${unconfiguredKey}-plain-text`).should('be.visible')
    })

    it('allows customizing label and label tooltip', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.getTestId(`${customizedKey}-label`).should('be.visible')
      cy.getTestId(`${customizedKey}-label`).should('contain.text', customLabel)
      cy.getTestId(`${customizedKey}-label-tooltip`).should('exist')
      cy.getTestId(`${customizedKey}-label-tooltip`).should('contain.text', customTooltip)
    })

    it('does not display fields marked `hidden`', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.get('[data-testid="tls_verify_depth-label"]').should('not.exist')
    })

    it('correctly displays data when `dataKey` prop is set', () => {
      const dataKey = 'data_key'
      const ignoredKey = 'ignored_key'

      cy.intercept(
        {
          method: 'GET',
          url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/services/${entityId}`,
        },
        {
          statusCode: 200,
          body: { [dataKey]: gatewayServiceRecord, [ignoredKey]: 'foobar' },
        },
      ).as('fetchRecord')

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
          dataKey,
        },
      })

      cy.wait('@fetchRecord')

      cy.getTestId('name-label').should('be.visible')
      cy.getTestId('name-property-value').should('be.visible').should('contain.text', gatewayServiceRecord.name)
      cy.getTestId(`${ignoredKey}-label`).should('not.exist')
      cy.getTestId(`${ignoredKey}-property-value`).should('not.exist')
    })

    it('displays a field that is not present in the response object when `forceShow` is true', () => {
      const undefinedKey = 'undefined_in_response_object_key'
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema: {
            ...configSchema,
            [undefinedKey]: { forceShow: true },
          },
          entityType,
          fetchUrl,
        },
      })

      cy.getTestId(`${undefinedKey}-label`).should('be.visible')
      cy.getTestId(`${undefinedKey}-property-value`).should('be.visible')
    })
  })

  describe('Section', () => {
    it('correctly breaks properties into sections', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.get(`[data-testid="config-card-details-advanced-props"] [data-testid="${customizedKey}-label"]`).should('exist')
    })

    it('does not display sections with no properties', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.get('[data-testid="config-card-details-plugin-props"]').should('not.exist')
    })
  })

  describe('Order', () => {
    it('sorts properties by `order`', () => {
      const expectedOrder = ['retries', 'connect_timeout', 'write_timeout', 'read_timeout']
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      expectedOrder.forEach((field: string, idx: number) => {
        cy.get(`[data-testid="config-card-details-advanced-props"] [data-testid="${field}-label"]`).should('exist')
        // displayed in correct order
        cy.get('[data-testid="config-card-details-advanced-props"] .config-card-details-row').eq(idx).should('contain.text', convertKeyToTitle(field))
      })
    })

    it('displays properties without an `order` at the end', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.get(`[data-testid="config-card-details-advanced-props"] [data-testid="${unconfiguredKey}-label"]`).should('exist')
      // displayed last
      cy.get('[data-testid="config-card-details-advanced-props"] .config-card-details-row').last().should('contain.text', convertKeyToTitle(unconfiguredKey))
    })
  })

  describe('Plugin Configuration', () => {
    it('hides plugin section when no `pluginConfigKey` provided', () => {
      interceptPluginFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl: pluginsFetchUrl,
          pluginConfigSchema,
        },
      })

      cy.get('[data-testid="config-card-details-plugin-props"]').should('not.exist')
    })

    it('sorts properties by `order`', () => {
      const expectedOrder = ['account_email', 'api_uri', 'cert_type']
      interceptPluginFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl: pluginsFetchUrl,
          pluginConfigKey,
          pluginConfigSchema,
        },
      })

      expectedOrder.forEach((field: string, idx: number) => {
        cy.get(`[data-testid="config-card-details-plugin-props"] [data-testid="${field}-label"]`).should('exist')
        // displayed in correct order
        cy.get('[data-testid="config-card-details-plugin-props"] .config-card-details-row').eq(idx).should('contain.text', convertKeyToTitle(field))
      })
    })

    it('correctly handles properties without an `order`', () => {
      interceptPluginFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl: pluginsFetchUrl,
          pluginConfigKey,
          pluginConfigSchema,
        },
      })

      // displays fields with a value first
      cy.get(`[data-testid="config-card-details-plugin-props"] [data-testid="${keyWithValue}-label"]`).should('exist')
      cy.get('[data-testid="config-card-details-plugin-props"] .config-card-details-row').last().should('not.contain.text', convertKeyToTitle(keyWithValue))
      // field with no value displayed last
      cy.get(`[data-testid="config-card-details-plugin-props"] [data-testid="${emptyKey}-label"]`).should('exist')
      cy.get('[data-testid="config-card-details-plugin-props"] .config-card-details-row').last().should('contain.text', convertKeyToTitle(emptyKey))
    })
  })

  describe('State Management & Events', () => {
    it('handles when load is unsuccessful', () => {
      cy.intercept(
        {
          method: 'GET',
          url: `${config.apiBaseUrl}/v2/control-planes/${config.controlPlaneId}/core-entities/services/${entityId}`,
        },
        {
          statusCode: 500,
          body: {},
        },
      ).as('fetchRecordError')

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.wait('@fetchRecordError')

      cy.get('.config-card-code-block').should('not.exist')
      cy.getTestId('config-card-fetch-error').should('be.visible').then(() => {
        // emits @fetch:error
        cy.wrap(Cypress.vueWrapper.emitted('fetch:error')).should('have.length', 1)
      })
    })

    it('loading event should be emitted when EntityBaseConfigCard emits loading event', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
          onLoading: cy.spy().as('onLoadingSpy'),
        },
      }).then(({ wrapper }) => wrapper)
        .as('vueWrapper')

      cy.get('@vueWrapper').then(wrapper => wrapper.findComponent(EntityBaseConfigCard)
        .vm.$emit('loading', true))

      cy.get('@onLoadingSpy').should('have.been.calledWith', true)
    })

    it('handles copy json click', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
      })

      cy.getTestId('select-config-format').click()
      cy.getTestId('select-item-json').click()

      cy.getTestId('code-block-copy-button-json-codeblock').should('be.visible')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.getTestId('code-block-copy-button-json-endpoint-codeblock').click().then(() => {
        // emits copy event
        cy.wrap(Cypress.vueWrapper.emitted).should('have.length', 1)
      })
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.getTestId('code-block-copy-button-json-codeblock').click().then(() => {
        // emits copy event
        cy.wrap(Cypress.vueWrapper.emitted).should('have.length', 1)
      })
    })

    it('displays error when invalid key passed through `dataKey` prop', () => {
      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
          dataKey: 'invalid_key',
        },
      })

      cy.getTestId('config-card-fetch-error').should('be.visible')
    })
  })

  describe('Slots', () => {
    it('allows slotting label and value', () => {
      const key = 'id'
      const slottedLabel = 'Slotted ID Label'
      const slottedValue = 'slotted-value'

      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
        slots: {
          [`${key}-label`]: h('div', {}, slottedLabel),
          [key]: h('div', {}, slottedValue),
        },
      })

      cy.getTestId(`${key}-label`).should('be.visible')
      cy.getTestId(`${key}-label`).should('contain.text', slottedLabel)
      cy.getTestId(`${key}-property-value`).should('contain.text', slottedValue)
      cy.getTestId(`${key}-label-tooltip`).should('not.exist')
    })

    it('allows slotting label tooltip', () => {
      const key = 'id'
      const slottedTooltip = 'Slotted Tooltip Value'

      interceptFetch()

      cy.mount(EntityBaseConfigCard, {
        props: {
          config,
          configSchema,
          entityType,
          fetchUrl,
        },
        slots: {
          [`${key}-label-tooltip`]: h('div', {}, slottedTooltip),
        },
      })

      cy.getTestId(`${key}-label-tooltip`).should('exist')
      cy.getTestId(`${key}-label-tooltip`).should('contain.text', slottedTooltip)
    })
  })
})
