// Cypress component test spec file
import { h } from 'vue'
import EntityDeleteModal from './EntityDeleteModal.vue'
import composables from '../../composables'

// Cypress `mount` typings don’t accept Volar’s SFC type (TS2769)
const EntityDeleteModalMount = EntityDeleteModal as any

describe('<EntityDeleteModal />', () => {
  const { i18n: { t } } = composables.useI18n()
  const entityType = 'route'
  const entityName = 'route-1'

  it('should show title and description', () => {
    const title = 'Continue?'
    const description = 'Shall we proceed?'
    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
        title,
        description,
      },
    })

    cy.get('.modal-header').should('contain.text', title)
    cy.get('.kong-ui-entity-delete-modal .description').should('contain.text', description)
  })

  it('should show entity type', () => {
    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
      },
    })

    cy.get('.kong-ui-entity-delete-modal .message')
      .should('contain.text', t('deleteModal.message', { entityType }))
    cy.get('.kong-ui-entity-delete-modal .description').should('not.exist')
    cy.get('.prompt-confirmation-text').should('not.exist')
  })

  it('should show entity name and confirmation input', () => {
    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
        entityName,
      },
    })

    cy.get('.kong-ui-entity-delete-modal .message')
      .should('contain.text', t('deleteModal.messageWithName', { entityType, entityName }))
    cy.get('.prompt-confirmation-text').should('exist')
  })

  it('should use entityTypeDisplay in the message when provided', () => {
    const entityTypeDisplay = 'Konnect-managed cache'
    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
        entityName,
        entityTypeDisplay,
      },
    })

    cy.get('.kong-ui-entity-delete-modal .message')
      .should('contain.text', t('deleteModal.messageWithName', { entityType: entityTypeDisplay, entityName }))
  })

  it('should disable action button', () => {
    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
        actionPending: true,
      },
    })

    cy.getTestId('modal-action-button').should('be.disabled')
  })

  it('should show description slot content', () => {
    const title = 'Continue?'
    const description = 'Shall we proceed?'

    cy.mount(EntityDeleteModalMount, {
      props: {
        visible: true,
        entityType,
        title,
      },
      slots: {
        description: h('span', description),
      },
    })

    cy.get('.modal-header').should('contain.text', title)
    cy.get('.kong-ui-entity-delete-modal .description').should('contain.text', description)
  })
})
