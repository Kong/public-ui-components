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

  describe('Code block record processing:', () => {
    const stubClipboard = () => cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').as('clipboardWriteText').resolves()
    })

    const formats: Array<{ format: 'json' | 'yaml' | 'deck', codeBlockId: string }> = [
      { format: 'json', codeBlockId: 'json-codeblock' },
      { format: 'yaml', codeBlockId: 'yaml-codeblock' },
      { format: 'deck', codeBlockId: 'deck-codeblock' },
    ]

    const buildProps = (format: 'json' | 'yaml' | 'deck', extra: Record<string, any> = {}) => ({
      format,
      record,
      ...(format === 'deck' ? { config: { app: 'konnect' } } : {}),
      ...extra,
    })

    formats.forEach(({ format, codeBlockId }) => {
      describe(`${format} format:`, () => {
        it('strips created_at and updated_at from the displayed code by default', () => {
          cy.mount(ConfigCardDisplay, { props: buildProps(format) })

          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('not.contain.text', 'created_at')
          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('not.contain.text', 'updated_at')
        })

        it('strips created_at and updated_at from the copied (unredacted) code', () => {
          cy.mount(ConfigCardDisplay, { props: buildProps(format, { codeBlockRecord: record }) })

          stubClipboard()
          cy.getTestId(`code-block-copy-button-${codeBlockId}`).click()
          cy.get('@clipboardWriteText').then((stub: any) => {
            const copied = stub.firstCall.args[0] as string
            expect(copied).to.not.include('created_at')
            expect(copied).to.not.include('updated_at')
          })
        })

        it('keeps timestamps when `preserveCodeBlockTimestamps` is true', () => {
          cy.mount(ConfigCardDisplay, { props: buildProps(format, { preserveCodeBlockTimestamps: true }) })

          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('contain.text', 'created_at')
          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('contain.text', 'updated_at')
        })

        it('uses `codeBlockRecordRedacted` for display and `codeBlockRecord` for copy', () => {
          const unredacted = { ...record, secret: 'plaintext-secret' }
          const redacted = { ...record, secret: '********' }

          cy.mount(ConfigCardDisplay, {
            props: buildProps(format, {
              codeBlockRecord: unredacted,
              codeBlockRecordRedacted: redacted,
            }),
          })

          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('contain.text', '********')
          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('not.contain.text', 'plaintext-secret')

          stubClipboard()
          cy.getTestId(`code-block-copy-button-${codeBlockId}`).click()
          cy.get('@clipboardWriteText').then((stub: any) => {
            const copied = stub.firstCall.args[0] as string
            expect(copied).to.include('plaintext-secret')
            expect(copied).to.not.include('********')
          })
        })

        it('applies `codeBlockRecordFormatter` to both displayed and copied content', () => {
          const formatter = (r: Record<string, any>) => ({ ...r, formatted: 'YES' })

          cy.mount(ConfigCardDisplay, {
            props: buildProps(format, {
              codeBlockRecord: record,
              codeBlockRecordFormatter: formatter,
            }),
          })

          cy.get(`#${codeBlockId}`).findTestId('highlighted-code-block').should('contain.text', 'formatted')

          stubClipboard()
          cy.getTestId(`code-block-copy-button-${codeBlockId}`).click()
          cy.get('@clipboardWriteText').then((stub: any) => {
            const copied = stub.firstCall.args[0] as string
            expect(copied).to.include('formatted')
            expect(copied).to.include('YES')
          })
        })
      })
    })
  })
})
