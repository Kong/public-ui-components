import UpstreamsFormHealthChecks from './UpstreamsFormHealthChecks.vue'

describe('<UpstreamsFormHealthChecks/>', () => {
  it('Component should be rendered correctly', () => {
    cy.mount(UpstreamsFormHealthChecks, {})

    cy.get('.active-health-switch').should('be.visible')
    cy.getTestId('active-health-switch').should('exist')
    cy.get('.passive-health-switch').should('be.visible')
    cy.getTestId('passive-health-switch').should('exist')
    cy.getTestId('upstreams-form-healthchecks-threshold').should('be.visible')
  })

  it('Should bind activeHealthSwitch data correctly', () => {
    cy.mount(UpstreamsFormHealthChecks, {
      props: {
        'onUpdate:active-health-switch': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('active-health-switch').check({ force: true })

    cy.get('@onUpdateSpy').should('have.been.calledWith', true)
  })

  it('Should bind passiveHealthSwitch data correctly', () => {
    cy.mount(UpstreamsFormHealthChecks, {
      props: {
        'onUpdate:passive-health-switch': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('passive-health-switch').check({ force: true })

    cy.get('@onUpdateSpy').should('have.been.calledWith', true)
  })

  it('Should bind healthchecksThreshold data correctly', () => {
    cy.mount(UpstreamsFormHealthChecks, {
      props: {
        'onUpdate:healthchecks-threshold': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('upstreams-form-healthchecks-threshold').type('2')

    cy.get('@onUpdateSpy').should('have.been.calledWith', '2')
  })
})
