// Cypress component test spec file
import EntityToggleModal from './EntityToggleModal.vue'
import composables from '../../composables'

describe('<EntityToggleModal />', () => {
  const { i18n: { t } } = composables.useI18n()

  const entity = {
    id: 'route-id-1',
    name: 'route-name-1',
    type: 'route',
  }

  for (const action of ['enable', 'disable'] as const) {
    let onConfirmSpy: Cypress.Agent<any>

    describe(`to ${action} an entity`, () => {
      const kConfirmDelay = 200

      beforeEach(() => {
        onConfirmSpy = cy.spy()
        cy.mount(EntityToggleModal, {
          props: {
            visible: true,
            action,
            entityId: entity.id,
            entityType: entity.type,
            entityName: entity.name,
            onConfirm: async () => {
              onConfirmSpy()
              await new Promise((resolve) => setTimeout(resolve, kConfirmDelay))
            },
          },
        })
      })

      it('should have correct title, body and button', () => {
        cy.get('.modal-header').should('contain.text', t(`toggleModal.${action}.title`, { entityType: entity.type }))
        cy.get('.modal-content').should('contain.text', t(`toggleModal.${action}.message`, { entityType: entity.type, entityName: entity.name }))
        cy.get('.modal-content strong').should('contain.text', entity.name)
        cy.getTestId('modal-action-button').should('contain.text', t(`toggleModal.${action}.confirmText`))
      })

      it('should emit a "cancel" event when clicking cancel button', () => {
        cy.wrap(Cypress.vueWrapper.emitted('cancel')).should('be.undefined')
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.getTestId('modal-cancel-button').click().then(() => {
          cy.wrap(Cypress.vueWrapper.emitted('cancel')).should('have.length', 1)
        })
      })

      it('should emit a "proceed" event after |onConfirm| finish', () => {
        cy.wrap(Cypress.vueWrapper.emitted('proceed')).should('be.undefined')
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.getTestId('modal-action-button').click().then(() => {
          // proceed should not be emitted immediately
          cy.wrap(Cypress.vueWrapper.emitted('proceed')).should('be.undefined')
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(kConfirmDelay + 10).then(() => {
            cy.wrap(Cypress.vueWrapper.emitted('proceed')).should('have.length', 1)
          })
        })
      })

      it('should disable action button when |onConfirm| is pending', () => {
        cy.getTestId('modal-action-button').should('not.be.disabled')
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.getTestId('modal-action-button').click().then(() => {
          cy.getTestId('modal-action-button').should('be.disabled')
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(kConfirmDelay + 10).then(() => {
            cy.getTestId('modal-action-button').should('not.be.disabled')
          })
        })
      })

      it.skip('should not |onConfirm| more than once when |onConfirm| is pending', () => {
        cy.wrap(onConfirmSpy).should('not.be.called')
        // eslint-disable-next-line cypress/unsafe-to-chain-command
        cy.getTestId('modal-action-button').click().then(() => {
          cy.wrap(onConfirmSpy).should('be.calledOnce')
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(10).then(() => {
            // eslint-disable-next-line cypress/unsafe-to-chain-command
            cy.getTestId('modal-action-button').click({ force: true }).then(() => {
              cy.wrap(onConfirmSpy).should('be.calledOnce')
            })
          })
        })
      })
    })
  }
})
