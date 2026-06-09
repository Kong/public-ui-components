import SensitiveInput from './SensitiveInput.vue'
import composables from '../../composables'

describe('<SensitiveInput />', () => {
  const { i18n: { t } } = composables.useI18n()

  const rotateLabel = t('sensitiveInput.rotateKey')
  const oneTimeHint = t('sensitiveInput.oneTimeHint')

  const input = () => cy.get('input')

  describe('create mode', () => {
    it('starts editable and emits update:modelValue while typing', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '' },
      })

      cy.getTestId('sensitive-input-rotate').should('not.exist')
      input().should('not.have.attr', 'readonly')
      input().type('my-secret')
      cy.then(() => Cypress.vueWrapper.emitted('update:modelValue'))
        .should('not.be.undefined')
    })

    it('masks the value by default and toggles visibility with the eye icon', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: 'super-secret' },
      })

      input().should('have.attr', 'type', 'password')
      cy.getTestId('sensitive-input-toggle').click()
      input().should('have.attr', 'type', 'text')
      cy.getTestId('sensitive-input-toggle').click()
      input().should('have.attr', 'type', 'password')
    })
  })

  describe('edit mode', () => {
    it('starts masked and read-only with a Rotate key action', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '', mode: 'edit' },
      })

      input().should('have.attr', 'readonly')
      cy.getTestId('sensitive-input-rotate').should('contain.text', rotateLabel)
      cy.getTestId('sensitive-input-toggle').should('not.exist')
    })

    it('switches to the editable state and emits "rotate" when Rotate key is clicked', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '', mode: 'edit' },
      })

      cy.getTestId('sensitive-input-rotate').click()
      cy.then(() => Cypress.vueWrapper.emitted('rotate')).should('have.length', 1)
      cy.getTestId('sensitive-input-rotate').should('not.exist')
      input().should('not.have.attr', 'readonly')
      cy.getTestId('sensitive-input-toggle').should('be.visible')
    })
  })

  describe('generate key', () => {
    it('hides the Generate key action when no generateKey prop is provided', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '' },
      })

      cy.getTestId('sensitive-input-generate').should('not.exist')
    })

    it('calls generateKey, writes the value back, reveals it and emits "generated"', () => {
      const generate = cy.stub().as('generate').resolves('generated-key-123')

      cy.mount(SensitiveInput, {
        props: {
          modelValue: '',
          generateKey: generate,
          'onUpdate:modelValue': (value: string) => {
            Cypress.vueWrapper.setProps({ modelValue: value })
          },
        },
      })

      cy.getTestId('sensitive-input-generate').click()
      cy.get('@generate').should('have.been.calledOnce')
      input().should('have.value', 'generated-key-123')
      input().should('have.attr', 'type', 'text')
      cy.then(() => Cypress.vueWrapper.emitted('generated'))
        .should('deep.equal', [['generated-key-123']])
    })
  })

  describe('one-time hint', () => {
    it('does not render the hint by default', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: 'a-key' },
      })

      cy.getTestId('sensitive-input-hint').should('not.exist')
    })

    it('renders the hint with a Copy action and reveals the value when showOneTimeHint is true', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: 'a-key', showOneTimeHint: true },
      })

      cy.getTestId('sensitive-input-hint').should('contain.text', oneTimeHint)
      cy.getTestId('sensitive-input-copy').should('be.visible')
      input().should('have.attr', 'type', 'text')
    })
  })
})
