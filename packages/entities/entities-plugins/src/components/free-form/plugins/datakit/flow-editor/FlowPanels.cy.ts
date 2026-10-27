import FlowPanels from './FlowPanels.vue'
import { goldenFixtures } from '../test-utils/fixtures'
import { mountWithStore } from '../test-utils/mount'

describe('<FlowPanels />', () => {
  it('renders every node of an existing config in preview mode', () => {
    const { pluginData } = goldenFixtures.find(({ id }) => id === 'conditionally-store-cached-items')!

    cy.viewport(1280, 800)
    mountWithStore(FlowPanels, { pluginData, props: { mode: 'preview' } })

    for (const { name } of pluginData.config!.nodes!) {
      cy.get('.vue-flow__node').contains(name).should('exist')
    }
  })
})
