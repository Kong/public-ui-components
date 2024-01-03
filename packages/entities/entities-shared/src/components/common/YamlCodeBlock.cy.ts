import YamlCodeBlock from './YamlCodeBlock.vue'

const record = {
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
}

describe('<YamlCodeBlock />', () => {
  describe('YamlCodeBlock', () => {
    it('renders the Yaml content correctly', () => {
      cy.mount(YamlCodeBlock, {
        props: {
          yamlRecord: record,
        },
      })

      cy.get('.yaml-config').should('be.visible')
    })
  })
})
