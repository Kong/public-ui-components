import ChangeLogLevelModal from './ChangeLogLevelModal.vue'
import type { ChangeLogLevelConfig, LogLevelOperationResult } from '../types'

const nodes = [
  { id: 'node-1', hostname: 'dp-1' },
  { id: 'node-2', hostname: 'dp-2' },
]

const getNodeDetailRoute = (nodeId: string): string => `https://example.com/nodes/${nodeId}`

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
      const resultsUrl = `${url}/*/results*`

      const interceptSubmission = (opts: { status?: number, delay?: number, body?: Record<string, any> } = {}): void => {
        cy.intercept('POST', url, {
          statusCode: opts.status ?? 200,
          body: opts.body ?? { id: 'op-1' },
          delay: opts.delay,
        }).as('submit')
      }

      // Each entry is the response for one poll; the last entry is repeated for any further polls.
      const interceptResults = (responses: Array<{ status?: number, data?: LogLevelOperationResult[] }> = [{ data: [] }]): void => {
        let call = 0
        cy.intercept('GET', resultsUrl, (req) => {
          const response = responses[Math.min(call, responses.length - 1)]
          call++
          req.reply({ statusCode: response.status ?? 200, body: { data: response.data ?? [] } })
        }).as('results')
      }

      const mountModal = (extraProps: Record<string, any> = {}) => {
        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes, getNodeDetailRoute, ...extraProps },
        })
      }

      it('renders the form fields, the always-on warning, and the action buttons', () => {
        mountModal()

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
        mountModal()

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
        mountModal({ nodes: [] })

        cy.get(actionButton).should('be.disabled')
      })

      it('sends the batch request with the default values and emits "success"', () => {
        interceptSubmission()
        interceptResults([{ data: [{ node_id: 'node-1', status: 'applied' }, { node_id: 'node-2', status: 'applied' }] }])

        mountModal({ onSuccess: cy.spy().as('successSpy') })

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
      })

      it('sends the selected log level and expiration', () => {
        interceptSubmission()
        interceptResults()

        mountModal()

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
        interceptResults()

        mountModal()

        cy.get(actionButton).click()
        cy.get(actionButton).should('be.disabled')

        cy.wait('@submit')
      })

      it('shows a danger alert with the error message when the request fails', () => {
        interceptSubmission({ status: 500, body: { message: 'Something went wrong' } })

        mountModal({ onSuccess: cy.spy().as('successSpy') })

        cy.get(actionButton).click()
        cy.wait('@submit')

        cy.getTestId('log-level-error').should('be.visible').and('contain.text', 'Something went wrong')
        cy.get('@successSpy').should('not.have.been.called')
        // Stays on the edit stage
        cy.getTestId('log-level-select').should('be.visible')
      })

      it('emits "close" on cancel', () => {
        mountModal({ onClose: cy.spy().as('closeSpy') })

        cy.get(cancelButton).click()
        cy.get('@closeSpy').should('have.been.calledOnce')
      })

      it('switches to the status view listing every node after Save', () => {
        interceptSubmission()
        interceptResults()

        mountModal()

        cy.get(actionButton).click()
        cy.wait('@results')

        // Title switches, form is gone, Cancel is hidden and the action button becomes "Done".
        cy.getTestId('change-log-level-modal').should('contain.text', 'Change log level status')
        cy.getTestId('log-level-select').should('not.exist')
        cy.get(cancelButton).should('not.exist')
        cy.get(actionButton).should('contain.text', 'Done')

        // One row per node, showing the hostname; default status while polling is "in progress".
        cy.getTestId('log-level-status-table').should('contain.text', 'dp-1').and('contain.text', 'dp-2')
        cy.getTestId('log-level-status-in_progress').should('have.length', 2)
      })

      it('keeps polling after close, then stops it and resets to the edit stage on reopen', () => {
        interceptSubmission()
        // Never settles, so polling would continue indefinitely on its own.
        interceptResults([{ data: [{ node_id: 'node-1', status: 'in_progress' }, { node_id: 'node-2', status: 'in_progress' }] }])

        cy.mount(ChangeLogLevelModal, {
          props: { config, visible: true, nodes, getNodeDetailRoute },
        }).then(({ wrapper }) => wrapper).as('wrapper')

        cy.get(actionButton).click()
        cy.wait('@results')
        cy.getTestId('log-level-status-table').should('be.visible')

        // Close the modal (host controls visibility). Polling must keep running in the background.
        cy.get('@wrapper').then((wrapper: any) => wrapper.setProps({ visible: false }))

        const counts: { atClose?: number, atReopen?: number } = {}
        cy.get('@results.all').then((calls) => {
          counts.atClose = calls.length
        })
        cy.wait(2500) // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('@results.all').then((calls) => {
          expect(calls.length, 'polling continues while closed').to.be.greaterThan(counts.atClose!)
        })

        // Reopen: the previous poll stops and the modal resets to the edit stage.
        cy.get('@wrapper').then((wrapper: any) => wrapper.setProps({ visible: true }))
        cy.getTestId('log-level-select').should('be.visible')
        cy.getTestId('log-level-status-table').should('not.exist')

        cy.get('@results.all').then((calls) => {
          counts.atReopen = calls.length
        })
        cy.wait(2500) // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('@results.all').then((calls) => {
          expect(calls.length, 'no more polls after reopen').to.equal(counts.atReopen!)
        })
      })

      it('renders a status badge per node from the polled results', () => {
        interceptSubmission()
        interceptResults([{ data: [{ node_id: 'node-1', status: 'applied' }, { node_id: 'node-2', status: 'failed' }] }])

        mountModal()

        cy.get(actionButton).click()
        cy.wait('@results')

        cy.getTestId('log-level-status-applied').should('be.visible')
        cy.getTestId('log-level-status-failed').should('be.visible')
      })

      it('stops polling once every node has settled', () => {
        interceptSubmission()
        interceptResults([{ data: [{ node_id: 'node-1', status: 'applied' }, { node_id: 'node-2', status: 'reverted' }] }])

        mountModal()

        cy.get(actionButton).click()
        cy.wait('@results')

        // No further polls after everything settled on the first response.
        cy.wait(2500) // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('@results.all').should('have.length', 1)
      })

      it('keeps polling 2s after a failed results response', () => {
        interceptSubmission()
        interceptResults([
          { status: 500 },
          { data: [{ node_id: 'node-1', status: 'applied' }, { node_id: 'node-2', status: 'applied' }] },
        ])

        mountModal()

        cy.get(actionButton).click()
        cy.wait('@results') // first poll -> 500
        cy.wait('@results') // retried ~2s later -> success

        cy.getTestId('log-level-status-applied').should('have.length', 2)
      })

      it('emits "node-error" once per node when a node fails or is unsupported', () => {
        interceptSubmission()
        interceptResults([
          { data: [{ node_id: 'node-1', status: 'failed' }, { node_id: 'node-2', status: 'in_progress' }] },
          { data: [{ node_id: 'node-1', status: 'failed' }, { node_id: 'node-2', status: 'unsupported' }] },
        ])

        mountModal({ onNodeError: cy.spy().as('nodeErrorSpy') })

        cy.get(actionButton).click()
        cy.wait('@results') // poll 1: node-1 failed
        cy.wait('@results') // poll 2 (~2s later): node-2 unsupported, node-1 still failed

        // node-1 was failed in both polls but only fires once; node-2 fires once -> two total.
        cy.get('@nodeErrorSpy').should('have.been.calledTwice')
        cy.get('@nodeErrorSpy').should('have.been.calledWith', { id: 'node-1', hostname: 'dp-1', status: 'failed' })
        cy.get('@nodeErrorSpy').should('have.been.calledWith', { id: 'node-2', hostname: 'dp-2', status: 'unsupported' })
      })

      it('links each Node host to getNodeDetailRoute', () => {
        interceptSubmission()
        interceptResults()

        mountModal()

        cy.get(actionButton).click()
        cy.wait('@results')

        cy.getTestId('log-level-status-table').find('a').first()
          .should('have.attr', 'href', 'https://example.com/nodes/node-1')
      })

      it('renders the Node host as plain text when getNodeDetailRoute is not provided', () => {
        interceptSubmission()
        interceptResults()

        mountModal({ getNodeDetailRoute: undefined })

        cy.get(actionButton).click()
        cy.wait('@results')

        cy.getTestId('log-level-status-table').should('contain.text', 'dp-1')
        cy.getTestId('log-level-status-table').find('a').should('not.exist')
      })

      it('emits "close" when Done is clicked', () => {
        interceptSubmission()
        interceptResults()

        mountModal({ onClose: cy.spy().as('closeSpy') })

        cy.get(actionButton).click()
        cy.wait('@results')

        cy.get(actionButton).should('contain.text', 'Done').click()
        cy.get('@closeSpy').should('have.been.calledOnce')
      })
    })
  })
})
