// Cypress component test spec file
import DeckCodeBlock from './DeckCodeBlock.vue'
import { SupportedEntityType } from '../../types'
import { route, pluginRecord, keySetRecord } from '../../../fixtures/mockData'

function selectShell(shell: 'bash' | 'powershell') {
  cy.get('.k-select').click()
  cy.getTestId(`select-item-${shell}`).click()
}


describe('<DeckCodeBlock />', () => {
  // Konnect specific props
  const controlPlaneName = 'test-control-plane'
  const geoApiServerUrl = 'https://us.api.konghq.tech'

  // Kong Manager specific props
  const workspace = 'default'
  const kongAdminApiUrl = 'https://localhost:8001'

  it('displays bash export command for macOS', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
        controlPlaneName,
      },
    })
    selectShell('bash')

    cy.get('#deck-env-codeblock')
      .should('contain.text', "export DECK_KONNECT_TOKEN='YOUR_KONNECT_PAT'")
  })

  it('displays PowerShell env command for Windows', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
        controlPlaneName,
      },
    })
    selectShell('powershell')

    cy.get('#deck-env-codeblock')
      .should('contain.text', '$env:DECK_KONNECT_TOKEN = "YOUR_KONNECT_PAT"')
  })

  it('should not display env command in Kong Manager', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'kongManager',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
      },
    })

    cy.get('#deck-env-codeblock').should('not.exist')
  })

  it('shows Konnect decK hint', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
      },
    })
    cy.getTestId('deck-hint-kongManager').should('not.exist')
    cy.getTestId('deck-hint-konnect').should('exist')
  })

  it('shows Kong Manager decK hint', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'kongManager',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
      },
    })
    cy.getTestId('deck-hint-kongManager').should('exist')
    cy.getTestId('deck-hint-konnect').should('not.exist')
  })

  it('generates deck command with version, control plane name, entity field and server url', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
        controlPlaneName,
        geoApiServerUrl,
      },
    })

    cy.get('#deck-codeblock')
      .should('be.visible')
      .should('contain.text', 'deck gateway apply -')
      .should('contain.text', `control_plane_name: ${controlPlaneName}`)
      .should('contain.text', '_format_version')
      .should('contain.text', 'routes:')
      .should('contain.text', `--konnect-addr ${geoApiServerUrl}`)
  })

  it('generates deck command for Kong Manager with workspace and kong admin api url', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'kongManager',
        entityRecord: route,
        entityType: SupportedEntityType.Route,
        workspace,
        kongAdminApiUrl,
      },
    })

    cy.get('#deck-codeblock')
      .should('be.visible')
      .should('contain.text', `_workspace: ${workspace}`)
      .should('contain.text', `--kong-addr ${kongAdminApiUrl}`)
  })

  it('converts referenced id object to id string', () => {
    const pluginWithService = {
      ...pluginRecord,
      service: { id: 'service-123' },
    }

    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: pluginWithService,
        entityType: SupportedEntityType.Plugin,
        controlPlaneName,
      },
    })

    cy.get('#deck-codeblock')
      .should('contain.text', 'service: service-123')
      .should('not.contain.text', 'id: service-123')
  })

  it('generates key_sets field for KeySet entity', () => {
    cy.mount(DeckCodeBlock, {
      props: {
        app: 'konnect',
        entityRecord: keySetRecord,
        entityType: SupportedEntityType.KeySet,
        controlPlaneName,
      },
    })

    cy.get('#deck-codeblock')
      .should('contain.text', 'key_sets:')
  })
})
