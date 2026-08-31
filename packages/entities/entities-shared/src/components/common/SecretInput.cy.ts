import { h } from 'vue'
import SecretInput from './SecretInput.vue'

describe('<SecretInput />', () => {
  const input = () => cy.get('input')

  it('uses text security when supported and reveals the value', () => {
    cy.stub(CSS, 'supports').withArgs('-webkit-text-security', 'disc').returns(true)
    cy.mount(SecretInput, {
      props: {
        modelValue: 'super-secret',
        'onUpdate:masked': (masked: boolean) => Cypress.vueWrapper.setProps({ masked }),
      },
    })

    input().should('have.attr', 'type', 'text')
    input().should('have.css', '-webkit-text-security', 'disc')
    input().should('have.attr', 'autocomplete', 'off')
    cy.getTestId('secret-input-toggle').should('have.attr', 'aria-label', 'Show secret').click()
    input().should('have.css', '-webkit-text-security', 'none')
    cy.getTestId('secret-input-toggle').should('have.attr', 'aria-label', 'Hide secret')
  })

  it('falls back to a password input when text security is unsupported', () => {
    cy.stub(CSS, 'supports').withArgs('-webkit-text-security', 'disc').returns(false)
    cy.mount(SecretInput, { props: { modelValue: 'super-secret' } })

    input().should('have.attr', 'type', 'password')
  })

  it('forwards KInput attributes, listeners, modifiers, and slots', () => {
    cy.mount(SecretInput, {
      props: {
        autocomplete: 'new-password',
        label: 'Password',
        modelModifiers: { trim: true },
        modelValue: '',
        'onUpdate:modelValue': (value: string) => Cypress.vueWrapper.setProps({ modelValue: value }),
      },
      attrs: { 'data-testid': 'forwarded-secret' },
      slots: { 'label-tooltip': () => h('strong', 'Tooltip') },
    })

    cy.getTestId('forwarded-secret').should('exist')
    input().should('have.attr', 'autocomplete', 'new-password').type(' value ')
    cy.then(() => Cypress.vueWrapper.emitted('update:modelValue')?.at(-1)).should('deep.equal', ['value'])
    cy.get('.tooltip-trigger-icon').trigger('mouseenter')
    cy.contains('Tooltip').should('exist')
  })

  it('blocks copy, cut, and drag while masked but allows paste', () => {
    cy.mount(SecretInput, { props: { modelValue: 'super-secret' } })

    input().then(($input) => {
      for (const name of ['copy', 'cut', 'dragstart']) {
        expect($input[0].dispatchEvent(new Event(name, { bubbles: true, cancelable: true }))).to.equal(false)
      }
      expect($input[0].dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }))).to.equal(true)
    })
  })

  it('supports a controlled masked state and custom after content', () => {
    cy.mount(SecretInput, {
      props: { masked: false, modelValue: 'super-secret' },
      slots: { after: ({ masked }: { masked: boolean }) => h('span', `${masked}`) },
    })

    cy.contains('false').should('exist')
    cy.getTestId('secret-input-toggle').should('exist')
  })

  it('allows callers to replace the mask toggle', () => {
    cy.mount(SecretInput, {
      props: { modelValue: 'super-secret', showMaskToggle: false },
      slots: { after: () => h('span', 'Custom action') },
    })

    cy.contains('Custom action').should('exist')
    cy.getTestId('secret-input-toggle').should('not.exist')
  })
})
