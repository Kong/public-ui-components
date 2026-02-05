import ConfigCardDisplay from './ConfigCardDisplay.vue'

const record = {
  created_at: 1682959038,
  destinations: [{ ip: '255.255.255.255', port: 123 }],
  https_redirect_status_code: 426,
  id: '15dea234-1725-4f5e-9564-ecb097a8f448',
  name: 'onboarding-ok-1682959038143',
  path_handling: 'v0',
  preserve_host: false,
  protocols: ['tcp'],
  regex_priority: 0,
  request_buffering: true,
  response_buffering: true,
  service: { id: 'b32e7e90-a3fb-450e-be12-454fc0f1925e' },
  sources: [{ ip: '255.255.255.255', port: 345 }],
  strip_path: true,
  tags: ['dev', 'prod'],
  updated_at: 1687965229,
}

describe('<ConfigCardDisplay />', () => {
  describe('Format Types:', () => {
    it('renders the JSON content and endpoint correctly', () => {
      const fetcherUrl = 'https://cloud.konghq.com/us/gateway-manager/91e192e0-5981-4662-a37d-7b24272c9da3/routes/0af86198-9822-46e0-9028-47b173caf4aa'
      cy.mount(ConfigCardDisplay, {
        props: {
          fetcherUrl,
          format: 'json',
          record,
        },
      })

      cy.get('.json-config').should('be.visible')
      cy.get('.json-endpoint').should('be.visible')
      cy.get('.json-endpoint').should('contain.text', 'get')
      cy.get('.json-endpoint').should('contain.text', fetcherUrl)
      cy.get('.json-endpoint').should('contain.text', 'Copy')
    })

    it('renders the Terraform content correctly', () => {
      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'terraform',
          record,
        },
      })

      cy.get('.terraform-config').should('be.visible')
    })

    it('renders the YAML content correctly', () => {
      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'yaml',
          record,
        },
      })

      cy.get('.yaml-config').should('be.visible')
    })

    it('renders the decK content correctly', () => {
      cy.mount(ConfigCardDisplay, {
        props: {
          format: 'deck',
          record,
        },
      })

      cy.get('.deck-config').should('be.visible')
    })
  })
})
