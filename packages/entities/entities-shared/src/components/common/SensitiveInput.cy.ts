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

    it('defaults to an empty value when modelValue is omitted', () => {
      cy.mount(SensitiveInput, {
        props: {},
      })

      input().should('have.value', '')
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
    it('hides the Generate key action when no generator prop is provided', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '' },
      })

      cy.getTestId('sensitive-input-generate').should('not.exist')
    })

    it('calls the generator, writes the value back, reveals it and emits "generated"', () => {
      const generate = cy.stub().as('generate').resolves('generated-key-123')

      cy.mount(SensitiveInput, {
        props: {
          modelValue: '',
          generator: generate,
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

  describe('multiline mode', () => {
    const textarea = () => cy.get('textarea')

    describe('create mode', () => {
      it('renders an editable textarea with no eye icon or rotate button', () => {
        cy.mount(SensitiveInput, {
          props: { modelValue: '', multiline: true },
        })

        textarea().should('not.have.attr', 'readonly')
        cy.getTestId('sensitive-input-toggle').should('not.exist')
        cy.getTestId('sensitive-input-rotate').should('not.exist')
      })

      it('emits update:modelValue while typing', () => {
        cy.mount(SensitiveInput, {
          props: { modelValue: '', multiline: true },
        })

        textarea().type('my-secret')
        cy.then(() => Cypress.vueWrapper.emitted('update:modelValue'))
          .should('not.be.undefined')
      })

      it('hides the Generate button when no generator prop is provided', () => {
        cy.mount(SensitiveInput, {
          props: { modelValue: '', multiline: true },
        })

        cy.getTestId('sensitive-input-generate').should('not.exist')
      })

      it('calls the generator, writes the value back and emits "generated"', () => {
        const generate = cy.stub().as('generate').resolves('generated-key-123')

        cy.mount(SensitiveInput, {
          props: {
            modelValue: '',
            multiline: true,
            generator: generate,
            'onUpdate:modelValue': (value: string) => {
              Cypress.vueWrapper.setProps({ modelValue: value })
            },
          },
        })

        cy.getTestId('sensitive-input-generate').click()
        cy.get('@generate').should('have.been.calledOnce')
        textarea().should('have.value', 'generated-key-123')
        cy.then(() => Cypress.vueWrapper.emitted('generated'))
          .should('deep.equal', [['generated-key-123']])
      })
    })

    describe('edit mode', () => {
      it('starts masked and read-only with a Rotate key button', () => {
        cy.mount(SensitiveInput, {
          props: { modelValue: '', multiline: true, mode: 'edit' },
        })

        textarea().should('have.attr', 'readonly')
        cy.getTestId('sensitive-input-rotate').should('contain.text', rotateLabel)
        cy.getTestId('sensitive-input-toggle').should('not.exist')
      })

      it('switches to editable state and emits "rotate" when Rotate is clicked', () => {
        cy.mount(SensitiveInput, {
          props: { modelValue: '', multiline: true, mode: 'edit' },
        })

        cy.getTestId('sensitive-input-rotate').click()
        cy.then(() => Cypress.vueWrapper.emitted('rotate')).should('have.length', 1)
        cy.getTestId('sensitive-input-rotate').should('not.exist')
        textarea().should('not.have.attr', 'readonly')
      })
    })

    it('renders the one-time hint banner with a Copy action', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: 'a-key', multiline: true, showOneTimeHint: true },
      })

      cy.getTestId('sensitive-input-hint').should('contain.text', oneTimeHint)
      cy.getTestId('sensitive-input-copy').should('be.visible')
    })

    it('renders the error message when error and errorMessage are both set', () => {
      cy.mount(SensitiveInput, {
        props: { modelValue: '', multiline: true, error: true, errorMessage: 'This field is required' },
      })

      cy.getTestId('sensitive-input-error-message').should('contain.text', 'This field is required')
    })
  })

  describe('custom labels', () => {
    it('overrides the rotate, generate and hint texts via the labels prop', () => {
      const labels = {
        rotateLabel: 'Rotate password',
        generateLabel: 'Generate password',
        hintLabel: 'The password is shown only once.',
      }

      cy.mount(SensitiveInput, {
        props: { modelValue: 'secret', mode: 'edit', generator: () => 'x', showOneTimeHint: true, labels },
      })

      cy.getTestId('sensitive-input-hint').should('contain.text', labels.hintLabel)
      cy.getTestId('sensitive-input-rotate').should('contain.text', labels.rotateLabel)
      cy.getTestId('sensitive-input-rotate').click()
      cy.getTestId('sensitive-input-generate').should('contain.text', labels.generateLabel)
    })
  })
})
