import EntityLink from './EntityLink.vue'
// import type { EntityLinkData } from '../../types'
import composables from '../../composables'

// const stub = () => {
// }

const resolvedRecord = {
  id: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219',
  name: 'record-name',
  label: 'dp-mock-msg-per-sec-us-dev',
  deleted: false,
}

const resolvedRecordComplex = {
  ...resolvedRecord,
  id: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
}

const deletedRecord = {
  ...resolvedRecord,
  deleted: true,
}

const emptyEntityUuidRecord = {
  ...resolvedRecord,
  id: 'uuid1:',
}

const routeParams = [
  'gateway-manager',
  resolvedRecordComplex?.id.toString().split(':')[0],
  'routes',
  resolvedRecordComplex?.id.toString().split(':')[1],
]

const generatedLink = composables.useExternalLinkCreator(routeParams)

const copyUuidStub = () => {
  return cy.window().its('navigator.clipboard').then((clipboard) => {
    cy.stub(clipboard, 'writeText').as('clipboardWriteText')
  })
}

describe('<EntityLink />', () => {
  // beforeEach(() => {
  //   cy.window().its('navigator.clipboard').then((clipboard) => {
  //     cy.stub(clipboard, 'writeText').as('clipboardWriteText')
  //   })
  // })

  it('resolved entity', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecord,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a.entity-link .kong-icon-externalLink').should('exist')
    cy.getTestId('entity-link-parent').find('.kong-ui-copy-uuid').should('exist').click()

    cy.get('.toaster-container-outer').should('exist')

    copyUuidStub().then(() => {
      expect('@clipboardWriteText').should('have.been.calledWith', resolvedRecord.id)
    })
    cy.getTestId('entity-link-parent').find('a').should('contain.text', resolvedRecord.label)
  })

  it('complex uuid with \':\'', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecordComplex,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a .kong-icon-externalLink').should('exist')
    cy.getTestId('entity-link-parent').find('.kong-ui-copy-uuid').should('exist').click()

    cy.get('.toaster-container-outer').should('exist')
    copyUuidStub().then(() => {
      expect('@clipboardWriteText').should('have.been.calledWith', resolvedRecord.id)
    })

    cy.getTestId('entity-link-parent').find('a').should('contain.text', resolvedRecord.label)
  })

  it('empty entity uuid with \':\'', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: emptyEntityUuidRecord,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('not.exist')
    cy.getTestId('entity-link-parent').find('.kong-ui-copy-uuid').should('not.exist')
    cy.getTestId('entity-link-parent').should('contain.text', ' – ')
  })

  it('deleted entity', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: deletedRecord,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('not.exist')
    cy.getTestId('entity-link-parent').find('.kong-ui-copy-uuid').should('exist').click()

    const firstFiveChars = `${deletedRecord.id.toString().slice(0, 5)}`

    cy.get('.toaster-container-outer').should('exist')
    copyUuidStub().then(() => {
      expect('@clipboardWriteText').should('have.been.calledWith', firstFiveChars)
    })

    const deletedDisplay = `${firstFiveChars} (deleted)`
    cy.getTestId('entity-link-parent').should('contain.text', deletedDisplay)
  })
})
