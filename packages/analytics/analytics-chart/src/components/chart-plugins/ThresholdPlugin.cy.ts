import { Line } from 'vue-chartjs'
import type { Plugin } from 'chart.js'
import { ThresholdPlugin } from './ThresholdPlugin'
import 'chart.js/auto'

const i18nMock = {
  t: (key: string, params: Record<string, any>) => {
    const translations: Record<string, string> = {
      'chartLabels.threshold-warning': `Warning Threshold: ${params.value}`,
      'chartLabels.threshold-error': `Error Threshold: ${params.value}`,
      'chartLabels.thatreshold-neutral': `Neutral Threshold: ${params.value}`,
    }
    return translations[key] || key
  },
} as any

const mount = ({
  plugins,
  pluginOptions = {},
} : {
  plugins: Plugin[]
  pluginOptions?: Record<string, any>
}) => {
  return cy.mount(Line, {
    props: {
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'Data One',
            backgroundColor: '#f87979',
            data: [40, 39, 10, 40, 39, 80, 40],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: pluginOptions,
      },
      plugins,
    },
  })
}

describe('ThresholdPlugin', () => {
  it('calls afterDatasetDraw with appropriate plugin options', () => {

    const thresholdPlugin = new ThresholdPlugin(i18nMock)
    cy.spy(thresholdPlugin, 'afterDatasetsDraw').as('afterDatasetDrawSpy')

    mount({
      plugins: [thresholdPlugin],
      pluginOptions: {
        thresholdPlugin: {
          threshold: {
            count: [
              { value: 50, type: 'warning' },
              { value: 70, type: 'error' },
              { value: 30, type: 'neutral' },
            ],
          },
        },
      },
    })

    cy.get('@afterDatasetDrawSpy').should('have.been.called')

    cy.get('@afterDatasetDrawSpy')
      .its('firstCall.args.2')
      .then((opts) => {
        expect(opts).to.have.property('threshold')
        expect(opts.threshold).to.have.property('count')
        expect(opts.threshold.count).to.have.length(3)
      })
  })
})
