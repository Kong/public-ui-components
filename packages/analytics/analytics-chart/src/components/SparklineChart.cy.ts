import SparklineChart from './SparklineChart.vue'

describe('<SparklineChart />', () => {
  it('renders empty', () => {
    cy.mount(SparklineChart as any, {
      props: {
        datasets: [{
          timestamps: [],
          label: 'test',
        }],
        maxCount: 10,
        minStamp: 1000,
        pointRenderCount: 100,
        type: 'sparkline_bar',
      },
    })

    cy.getTestId('sparkline-empty').should('exist')
  })

  it('renders bar', () => {
    cy.mount(SparklineChart as any, {
      props: {
        datasets: [{
          timestamps: [200, 300, 400, 500],
          label: 'test',
        }],
        maxCount: 10,
        maxStamp: 2000,
        minStamp: 100,
        pointRenderCount: 10,
        type: 'sparkline_bar',
      },
    })

    cy.getTestId('sparkline-bar').should('exist')
  })

  it('renders line', () => {
    cy.mount(SparklineChart as any, {
      props: {
        datasets: [{
          timestamps: [200, 300, 400, 500],
          label: 'test',
        }],
        maxStamp: 200000,
        minStamp: 100,
        pointRenderCount: 10,
        type: 'sparkline_line',
      },
    })

    cy.getTestId('sparkline-line').should('exist')
  })

  it('renders step', () => {
    cy.mount(SparklineChart as any, {
      props: {
        datasets: [{
          timestamps: [200, 300, 400, 500],
          label: 'test',
        }],
        maxCount: 10,
        maxStamp: 2000,
        minStamp: 100,
        pointRenderCount: 10,
        type: 'sparkline_step',
      },
    })

    cy.getTestId('sparkline-step').should('exist')
  })
})

