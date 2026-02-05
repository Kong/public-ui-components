import { h } from 'vue'
import EntityFormBlock from './EntityFormBlock.vue'

describe('<EntityFormBlock />', () => {
  it('check prop content renders when all props are passed', () => {
    const step = 1
    const title = 'Test Title'
    const description = 'Test Description'

    cy.mount(EntityFormBlock, {
      props: {
        step,
        title,
        description,
      },
    })

    cy.getTestId('form-block-step').should('be.visible')
    cy.getTestId('form-block-step').should('contain.text', step)
    cy.getTestId('header-title').should('be.visible')
    cy.getTestId('header-title').should('contain.text', title)
    cy.getTestId('header-description').should('be.visible')
    cy.getTestId('header-description').should('contain.text', description)
  })

  it('check slot content renders when all slots have content passed', () => {
    const stepSlotContent = 'Step Slot'
    const titleSlotContent = 'Title Slot'
    const descriptionSlotContent = 'Description Slot'
    const extraSlotContent = 'Extra Slot'
    const defaultSlotContent = 'Default Slot'

    cy.mount(EntityFormBlock, {
      slots: {
        step: h('div', {}, stepSlotContent),
        title: h('div', {}, titleSlotContent),
        description: h('div', {}, descriptionSlotContent),
        extra: h('div', {}, extraSlotContent),
        default: h('div', {}, defaultSlotContent),
      },
    })

    cy.getTestId('form-block-step').should('be.visible')
    cy.getTestId('form-block-step').should('contain.text', stepSlotContent)
    cy.getTestId('header-title').should('be.visible')
    cy.getTestId('header-title').should('contain.text', titleSlotContent)
    cy.getTestId('header-description').should('be.visible')
    cy.getTestId('header-description').should('contain.text', descriptionSlotContent)
    cy.getTestId('header-extra').should('be.visible')
    cy.getTestId('header-extra').should('contain.text', extraSlotContent)
    cy.getTestId('form-block-content').should('be.visible')
    cy.getTestId('form-block-content').should('contain.text', defaultSlotContent)
  })
})

