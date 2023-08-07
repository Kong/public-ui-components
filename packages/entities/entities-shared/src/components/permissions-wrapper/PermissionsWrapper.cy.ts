// Cypress component test spec file
import PermissionsWrapper from './PermissionsWrapper.vue'
import { h } from 'vue'

describe('<PermissionsWrapper />', () => {
  it('should show the slot content by default', () => {
    const slotContent = 'I need to slot some content'

    cy.mount(PermissionsWrapper, {
      slots: {
        default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
      },
    })

    cy.getTestId('slot-content').should('be.visible')
  })

  describe('authFunction', () => {

    it('should show the slot content if the authFunction evaluates to true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => true

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
    })

    it('should not show the slot content if the authFunction evaluates to false', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => false

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('not.exist')
    })

    it('should not show the slot content if the authFunction evaluates to undefined', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => undefined

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('not.exist')
    })

    it('should show the slot content after a long delay if the authFunction evaluates to true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        return true
      }

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
    })
  })

  describe('forceShow', () => {
    it('should show the slot content by default if the forceShow prop is true', () => {
      const slotContent = 'I need to slot some content'

      cy.mount(PermissionsWrapper, {
        props: {
          forceShow: true,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
    })

    it('should show the slot content if the authFunction evaluates to true and forceShow is true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => true

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
          forceShow: true,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
    })

    it('should show the slot content if the authFunction evaluates to false but forceShow is true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => false

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
          forceShow: true,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
    })

    it('should not show the slot content if the authFunction evaluates to undefined even if forceShow is true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => undefined

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
          forceShow: true,
        },
        slots: {
          default: () => h('div', { 'data-testid': 'slot-content' }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('not.exist')
    })
  })

  describe('slotProps', () => {
    it('should pass the isAllowed slot prop when authFunction returns true and forceShow is false', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => true

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
          forceShow: false,
        },
        slots: {
          default: ({ isAllowed }: { isAllowed: boolean }) => h('div', { 'data-testid': 'slot-content', class: `is-allowed-${isAllowed}` }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
      cy.getTestId('slot-content').should('have.class', 'is-allowed-true')
    })

    it('should pass the isAllowed slot prop when authFunction returns false and forceShow is true', () => {
      const slotContent = 'I need to slot some content'
      const testFn = async () => false

      cy.mount(PermissionsWrapper, {
        props: {
          authFunction: testFn,
          forceShow: true,
        },
        slots: {
          default: ({ isAllowed }: { isAllowed: boolean }) => h('div', { 'data-testid': 'slot-content', class: `is-allowed-${isAllowed}` }, slotContent),
        },
      })

      cy.getTestId('slot-content').should('be.visible')
      cy.getTestId('slot-content').should('have.class', 'is-allowed-false')
    })
  })
})
