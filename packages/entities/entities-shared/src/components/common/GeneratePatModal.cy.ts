import GeneratePatModal from './GeneratePatModal.vue'
import composables from '../../composables'

describe('<GeneratePatModal />', () => {
  const { i18n: { t } } = composables.useI18n()

  const cancelLabel = t('generatePatModal.actions.cancel')
  const generateLabel = t('generatePatModal.actions.generate')
  const generatingLabel = t('generatePatModal.actions.generating')
  const namePlaceholder = t('generatePatModal.fields.name.placeholder')

  const nameInput = () => cy.get(`input[placeholder="${namePlaceholder}"]`)

  it('renders nothing when not visible', () => {
    cy.mount(GeneratePatModal, {
      props: {
        visible: false,
        generateKonnectPat: cy.stub().as('generate'),
      },
    })

    cy.contains(t('generatePatModal.title')).should('not.exist')
  })

  it('renders title and description when visible', () => {
    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: cy.stub().as('generate'),
      },
    })

    cy.contains(t('generatePatModal.title')).should('be.visible')
    cy.contains(t('generatePatModal.description')).should('be.visible')
    nameInput().should('be.visible')
  })

  it('keeps the Generate button disabled until a name is entered', () => {
    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: cy.stub().as('generate'),
      },
    })

    cy.contains('button', generateLabel).should('be.disabled')
    nameInput().type('my-token')
    cy.contains('button', generateLabel).should('not.be.disabled')
  })

  it('emits "dismiss" when the Cancel button is clicked', () => {
    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: cy.stub().as('generate'),
      },
    })

    cy.contains('button', cancelLabel).click()
    cy.then(() => Cypress.vueWrapper.emitted('dismiss')).should('have.length', 1)
  })

  it('calls generateKonnectPat with name + expiresAt and emits "generated" on success', () => {
    const before = new Date()
    const generate = cy.stub().as('generate').resolves('kpat_test')

    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: generate,
      },
    })

    nameInput().type('my-token')
    cy.contains('button', generateLabel).click()
    cy.get('@generate').should('have.been.calledOnce')
    cy.get('@generate').then((stub: any) => {
      const [name, expiresAt] = stub.firstCall.args
      expect(name).to.equal('my-token')
      expect(expiresAt).to.be.instanceOf(Date)
      // default is 30 days; allow a little clock slack around the boundary
      const diffDays = (expiresAt.getTime() - before.getTime()) / 86_400_000
      expect(diffDays).to.be.within(29.9, 30.1)
    })
    cy.then(() => Cypress.vueWrapper.emitted('generated')).should('deep.equal', [['kpat_test']])
  })

  it('shows an error alert when generateKonnectPat rejects', () => {
    const generate = cy.stub().as('generate').rejects(new Error('boom'))

    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: generate,
      },
    })

    nameInput().type('my-token')
    cy.contains('button', generateLabel).click()
    cy.contains('boom').should('be.visible')
    cy.then(() => Cypress.vueWrapper.emitted('generated')).should('be.undefined')
  })

  it('disables the button and shows the pending label while generating', () => {
    let resolvePromise!: (value: string) => void
    const pending = new Promise<string>((resolve) => resolvePromise = resolve)
    const generate = cy.stub().as('generate').returns(pending)

    cy.mount(GeneratePatModal, {
      props: {
        visible: true,
        generateKonnectPat: generate,
      },
    })

    nameInput().type('my-token')
    cy.contains('button', generateLabel).click()

    cy.contains('button', generatingLabel).should('be.disabled').then(() => {
      resolvePromise('kpat_test')
    })
    cy.contains('button', generateLabel).should('not.be.disabled')
  })
})
