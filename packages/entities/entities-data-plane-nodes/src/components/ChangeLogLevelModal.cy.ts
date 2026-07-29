import ChangeLogLevelModal from './ChangeLogLevelModal.vue'
import type { ChangeLogLevelConfig } from '../types'

const nodes = [
  { id: 'node-1', hostname: 'dp-1' },
  { id: 'node-2', hostname: 'dp-2' },
]

const konnectConfig: ChangeLogLevelConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: '1234-cp',
}

const kongManagerConfig: ChangeLogLevelConfig = {
  app: 'kongManager',
  apiBaseUrl: '/kong-manager',
}

const cases = [
  {
    name: 'Konnect',
    config: konnectConfig,
    url: `${konnectConfig.apiBaseUrl}/v2/control-planes/1234-cp/nodes/log-level-operations`,
  },
  {
    name: 'Kong Manager',
    config: kongManagerConfig,
    url: `${kongManagerConfig.apiBaseUrl}/debug/cluster/data-planes/log-level-operations`,
  },
]

const actionButton = '.k-modal .footer-actions button[data-testid="modal-action-button"]'
const cancelButton = '.k-modal .footer-actions button[data-testid="modal-cancel-button"]'

describe('<ChangeLogLevelModal />', { viewportHeight: 700, viewportWidth: 700 }, () => {
  cases.forEach(({ name, config, url }) => {
    describe(name, () => {
      const interceptSubmission = (opts: { status?: number, delay?: number, body?: Record<string, any> } = {}): void => {
        cy.intercept('POST', url, {
          statusCode: opts.status ?? 200,
          body: opts.body ?? {},
          delay: opts.delay,
        }).as('submit')
      }

      it('renders the form fields, the always-on warning, and the action buttons', () => {
        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes },
        })

        cy.getTestId('change-log-level-modal').find('.modal-container').should('be.visible')
        cy.getTestId('log-level-warning').should('be.visible')
        cy.getTestId('log-level-select').should('be.visible')
        cy.getTestId('expiration-input').should('be.visible')
        cy.get(actionButton).should('be.visible')
        cy.get(cancelButton).should('be.visible')
        // No error until a request fails
        cy.getTestId('log-level-error').should('not.exist')
      })

      it('disables Save when the expiration is out of the 1-3600 range', () => {
        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes },
        })

        cy.get(actionButton).should('be.enabled')

        cy.getTestId('expiration-input').clear()
        cy.getTestId('expiration-input').type('0')
        cy.get(actionButton).should('be.disabled')

        cy.getTestId('expiration-input').clear()
        cy.getTestId('expiration-input').type('4000')
        cy.get(actionButton).should('be.disabled')

        cy.getTestId('expiration-input').clear()
        cy.getTestId('expiration-input').type('120')
        cy.get(actionButton).should('be.enabled')
      })

      it('disables Save when there are no nodes', () => {
        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes: [] },
        })

        cy.get(actionButton).should('be.disabled')
      })

      it('sends the batch request with the default values and emits "success"', () => {
        interceptSubmission()

        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes, onSuccess: cy.spy().as('successSpy') },
        })

        cy.get(actionButton).click()

        cy.wait('@submit').then(({ request }) => {
          expect(request.body).to.deep.equal({
            log_level: 'notice',
            ttl: 600,
            targets: { node_ids: ['node-1', 'node-2'] },
          })
        })

        cy.get('@successSpy').should('have.been.calledOnce')
        // The modal does not close itself - the host controls visibility.
        cy.getTestId('change-log-level-modal').find('.modal-container').should('be.visible')
        cy.getTestId('log-level-error').should('not.exist')
      })

      it('sends the selected log level and expiration', () => {
        interceptSubmission()

        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes },
        })

        cy.getTestId('log-level-select').click()
        cy.getTestId('log-level-select-popover').find('button[value="debug"]').click()

        cy.getTestId('expiration-input').clear()
        cy.getTestId('expiration-input').type('120')

        cy.get(actionButton).click()

        cy.wait('@submit').then(({ request }) => {
          expect(request.body).to.deep.equal({
            log_level: 'debug',
            ttl: 120,
            targets: { node_ids: ['node-1', 'node-2'] },
          })
        })
      })

      it('disables Save while the request is in flight', () => {
        interceptSubmission({ delay: 300 })

        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes },
        })

        cy.get(actionButton).click()
        cy.get(actionButton).should('be.disabled')

        cy.wait('@submit')
        cy.get(actionButton).should('be.enabled')
      })

      it('shows a danger alert with the error message when the request fails', () => {
        interceptSubmission({ status: 500, body: { message: 'Something went wrong' } })

        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes, onSuccess: cy.spy().as('successSpy') },
        })

        cy.get(actionButton).click()
        cy.wait('@submit')

        cy.getTestId('log-level-error').should('be.visible').and('contain.text', 'Something went wrong')
        cy.get('@successSpy').should('not.have.been.called')
      })

      it('emits update:visible=false on cancel', () => {
        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes, 'onUpdate:visible': cy.spy().as('visibleSpy') },
        })

        cy.get(cancelButton).click()
        cy.get('@visibleSpy').should('have.been.calledWith', false)
      })
    })
  })
})
