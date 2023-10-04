import ConfigCardDisplay from './ConfigCardDisplay.vue'

describe('<ConfigCardDisplay />', () => {
  describe('Format Types:', () => {
    it('renders the Structured content correctly', () => {
      const propListType = ['basic', 'advanced']
      const item = {
        basic: [
          {
            key: 'id',
            value: '15dea234-1725-4f5e-9564-ecb097a8f448',
            hidden: false,
            type: 'id',
            label: 'ID',
            section: 'basic',
          },
          {
            key: 'name',
            value: 'onboarding-ok-1682959038143',
            hidden: false,
            type: 'plain-text',
            label: 'Name',
            tooltip: "The name of the Route. Route names must be unique, and they are case sensitive. For example, there can be two different Routes named 'test' and 'Test'.",
            section: 'basic',
          },
          {
            key: 'updated_at',
            value: 1687965229,
            hidden: false,
            type: 'date',
            label: 'Last Updated',
            section: 'basic',
          },
          {
            key: 'created_at',
            value: 1682959038,
            hidden: false,
            type: 'date',
            label: 'Created',
            section: 'basic',
          },
          {
            key: 'service',
            value: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' },
            hidden: false,
            type: 'plain-text',
            label: 'Gateway Service',
            tooltip: 'The Service this Route is associated to. This is where the Route proxies traffic to.',
            section: 'basic',
          },
        ],
        advanced: [
          {
            key: 'https_redirect_status_code',
            value: 426,
            hidden: false,
            type: 'plain-text',
            label: 'Https Redirect Status Code',
            section: 'advanced',
          },
          {
            key: 'regex_priority',
            value: 0,
            hidden: false,
            type: 'plain-text',
            label: 'Regex Priority',
            tooltip: 'A number used to choose which route resolves a given request when several routes match it using regexes simultaneously. When two routes match the path and have the same {code1}, the older one (lowest {code2}) is used. Note that the priority for non-regex routes is different (longer non-regex routes are matched before shorter ones).',
            section: 'advanced',
          },
        ],
        plugin: [],
      }

      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'structured',
          propListType,
          item,
        },
      })

      cy.get('.config-card-details-row').should('be.visible')
    })

    it('renders the YAML content correctly', () => {
      const record = { created_at: 1682959038, destinations: [{ ip: '255.255.255.255', port: 123 }], https_redirect_status_code: 426, id: '15dea234-1725-4f5e-9564-ecb097a8f448', name: 'onboarding-ok-1682959038143', path_handling: 'v0', preserve_host: false, protocols: ['tcp'], regex_priority: 0, request_buffering: true, response_buffering: true, service: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' }, sources: [{ ip: '255.255.255.255', port: 345 }], strip_path: true, tags: ['dev', 'prod'], updated_at: 1687965229 }

      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'yaml',
          record,
        },
      })

      cy.get('.config-card-display-yaml').should('be.visible')
    })

    it('renders the JSON content correctly', () => {
      const record = { created_at: 1682959038, destinations: [{ ip: '255.255.255.255', port: 123 }], https_redirect_status_code: 426, id: '15dea234-1725-4f5e-9564-ecb097a8f448', name: 'onboarding-ok-1682959038143', path_handling: 'v0', preserve_host: false, protocols: ['tcp'], regex_priority: 0, request_buffering: true, response_buffering: true, service: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' }, sources: [{ ip: '255.255.255.255', port: 345 }], strip_path: true, tags: ['dev', 'prod'], updated_at: 1687965229 }

      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'json',
          record,
        },
      })

      cy.get('.config-card-display-json').should('be.visible')
    })
  })
})
