import { computed, defineComponent, h, ref, type PropType } from 'vue'
import { Line as LineChart } from 'vue-chartjs'
import type { Plugin } from 'chart.js'
import { ThresholdPlugin } from './ThresholdPlugin'
import 'chart.js/auto'

const i18nMock = {
  t: (key: string, params: Record<string, any>) => {
    const translations: Record<string, string> = {
      'chartLabels.threshold-warning': `Warning Threshold: ${params.value}`,
      'chartLabels.threshold-error': `Error Threshold: ${params.value}`,
      'chartLabels.threshold-neutral': `Neutral Threshold: ${params.value}`,
    }
    return translations[key] || key
  },
} as any

const TestHost = defineComponent({
  name: 'ChartHost',
  components: { LineChart },
  props: {
    plugins: { type: Array as PropType<Plugin[]>, required: true },
    initialPluginOptions: { type: Object as PropType<Record<string, any>>, required: true },
  },
  setup(props) {
    const pluginsOptions = ref<Record<string, any>>(props.initialPluginOptions)

    const setPluginOptions = (next: Record<string, any>) => {
      pluginsOptions.value = next
    }
    // make callable from the test via window (simple and reliable in Cypress)
    ;(window as any).__setPluginOptions = setPluginOptions

    const data = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [{ label: 'Data One', backgroundColor: '#f87979', data: [40, 39, 10, 40, 39, 80, 40] }],
    }

    const options = computed(() => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: pluginsOptions.value,
      animation: false,
    }))

    return () =>
      h(LineChart as any, {
        data,
        options: options.value,
        plugins: props.plugins,
      })
  },
})

const mount = ({
  plugins,
  pluginOptions = {},
}: {
  plugins: Plugin[]
  pluginOptions?: Record<string, any>
}) => {
  return cy.mount(TestHost, {
    props: {
      plugins,
      initialPluginOptions: pluginOptions,
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

  it('prunes thresholds that are no longer in the options when metric changes', () => {
    const thresholdPlugin = new ThresholdPlugin(i18nMock)
    cy.spy(thresholdPlugin, 'beforeUpdate').as('beforeUpdateSpy')

    mount({
      plugins: [thresholdPlugin],
      pluginOptions: {
        thresholdPlugin: {
          threshold: {
            count: [{ value: 70, type: 'error' }],
          },
        },
      },
    })

    // initial paint/update
    cy.get('@beforeUpdateSpy').should('have.been.called')

    cy.then(() => {
      expect(thresholdPlugin.thresholds).to.have.property('count')
    })

    // change metric: remove `count`, add `latency_p99_ms`
    cy.window().then((win: any) => {
      win.__setPluginOptions({
        thresholdPlugin: {
          threshold: {
            latency_p99_ms: [{ value: 50, type: 'error' }],
          },
        },
      })
    })

    cy.get('@beforeUpdateSpy').should('have.callCount', 2)

    // assert plugin saw a new options object and that obsolete `count` was pruned
    cy.get('@beforeUpdateSpy')
      .its('lastCall.args.2')
      .then((opts) => {
        expect(opts).to.have.property('threshold')
        expect(opts.threshold).to.not.have.property('count')
        expect(opts.threshold).to.have.property('latency_p99_ms')
        expect(opts.threshold.latency_p99_ms).to.have.length(1)
      })

    cy.then(() => {
      expect(thresholdPlugin.thresholds).to.not.have.property('count')
      expect(thresholdPlugin.thresholds).to.have.property('latency_p99_ms')
    })
  })
})
