import SandboxLayout from './SandboxLayout.vue'
import { h } from 'vue'
import type { SandboxNavigationItem } from '../types'

describe('<SandboxLayout />', () => {
  beforeEach(() => {
    cy.viewport(1280, 728)
  })

  describe('slots', () => {
    describe('default', () => {
      it('renders default slot content', () => {
        const slotText = 'This is the content'

        cy.mount(SandboxLayout, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
          },
        })

        cy.getTestId('default-slot-content').should('be.visible')
        cy.getTestId('default-slot-content').should('contain.text', slotText)
      })
    })

    describe('controls', () => {
      it('renders controls slot content', () => {
        const slotText = 'This is the content'
        const controlsText = 'This is the controls content'

        cy.mount(SandboxLayout, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
            controls: () => h('div', { 'data-testid': 'controls-slot-content' }, controlsText),
          },
        })

        cy.getTestId('default-slot-content').should('be.visible')
        cy.getTestId('default-slot-content').should('contain.text', slotText)

        cy.getTestId('controls-slot-content').should('be.visible')
        cy.getTestId('controls-slot-content').should('contain.text', controlsText)
      })

      it('should not render the controls slot container when no slot content is provided', () => {
        const slotText = 'This is the content'

        cy.mount(SandboxLayout, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
          },
        })

        cy.getTestId('default-slot-content').should('be.visible')
        cy.getTestId('default-slot-content').should('contain.text', slotText)

        cy.get('.sandbox-controls').should('not.exist')
      })
    })
  })

  describe('props', () => {
    describe('title', () => {
      it('renders a title string', () => {
        const slotText = 'This is the content'
        const title = 'This is the title'

        cy.mount(SandboxLayout, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
          },
          props: {
            title,
          },
        })

        cy.get('.sandbox-container h1').should('be.visible').and('contain.text', title)
      })
    })

    describe('links', () => {
      it('renders links', () => {
        const slotText = 'This is the content'

        const navLinks: SandboxNavigationItem[] = [
          {
            name: 'Home',
            to: { name: 'home' },
          },
          {
            name: 'About',
            to: { name: 'about' },
          },
        ]

        cy.mount(SandboxLayout, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
          },
          props: {
            links: navLinks,
          },
        })

        cy.get('.kong-ui-sandbox-navigation').should('be.visible')
        cy.get('li.sandbox-link').should('have.length', navLinks.length)
        cy.get('li.sandbox-link').eq(0).should('contain.text', 'Home')
        cy.get('li.sandbox-link').eq(1).should('contain.text', 'About')
      })
    })
  })
})
