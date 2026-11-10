import { h, type Component } from 'vue'

export function testConfigCardView(name: string, view: Component, props: { record: { id: string } } & Record<string, unknown>) {
  it(`${name} renders one card with title and actions slots and local code formats without requests`, () => {
    cy.intercept({ resourceType: /xhr|fetch/ }, req => {
      throw new Error(`Unexpected View request ${req.url}`)
    })
    cy.mount(view, { props, slots: {
      title: () => 'Host title',
      actions: () => h('a', { href: '/docs' }, 'Documentation'),
      id: () => h('span', 'field override'),
    } })
    cy.get('.kong-ui-entity-base-config-card').should('have.length', 1)
    cy.getTestId('config-card-title').should('contain.text', 'Host title')
    cy.get('.config-card-actions a[href="/docs"]').should('contain.text', 'Documentation')
    cy.getTestId('id-property-value').should('contain.text', props.record.id).and('not.contain.text', 'field override')
    cy.getTestId('select-config-format').click()
    cy.getTestId('select-item-json').click()
    cy.get('#json-codeblock').should('contain.text', props.record.id)
  })
}
