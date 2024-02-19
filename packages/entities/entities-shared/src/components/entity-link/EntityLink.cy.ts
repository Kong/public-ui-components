import EntityLink from './EntityLink.vue'
import composables from '../../composables'

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
    return cy.stub(clipboard, 'writeText').as('clipboardWriteText')
  })
}
describe('<EntityLink />', () => {

  it('resolved entity', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecord,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('have.attr', 'target', '_blank')
    cy.getTestId('entity-link-parent').find('a.entity-link .kui-icon.external-link-icon').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('contain.text', resolvedRecord.label)

    copyUuidStub().then(() => {
      cy.getTestId('entity-link-parent').find('.entity-link-copy-id').should('exist').click()

      cy.get('@clipboardWriteText').should('have.been.calledWith', resolvedRecord.id)
    })
  })

  it('complex uuid with \':\'', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecordComplex,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('have.attr', 'target', '_blank')
    cy.getTestId('entity-link-parent').find('a .kui-icon.external-link-icon').should('exist')

    copyUuidStub().then(() => {
      cy.getTestId('entity-link-parent').find('.entity-link-copy-id').should('exist').click()

      cy.get('@clipboardWriteText').should('have.been.calledWith', resolvedRecordComplex?.id.toString().split(':')[1])
    })
  })

  it('empty entity uuid with \':\'', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: emptyEntityUuidRecord,
        externalLink: generatedLink,
      },
    })

    cy.getTestId('entity-link-parent').find('a').should('not.exist')
    cy.getTestId('entity-link-parent').find('.entity-link-copy-id').should('not.exist')
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

    const firstFiveChars = `${deletedRecord.id.toString().slice(0, 5)}`
    const deletedDisplay = `${firstFiveChars} (deleted)`
    cy.getTestId('entity-link-parent').should('contain.text', deletedDisplay)

    copyUuidStub().then(() => {
      cy.getTestId('entity-link-parent').find('.entity-link-copy-id').should('exist').click()

      cy.get('@clipboardWriteText').should('have.been.calledWith', resolvedRecord.id)
    })
  })

  it('hides the External Link icon', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecord,
        externalLink: generatedLink,
        newWindow: false,
      },
    })

    cy.getTestId('kui-icon-wrapper-external-link-icon').should('not.exist')
    cy.getTestId('entity-link-parent').find('.copy-uuid-tooltip').should('exist')

    // Ensure that link is set to open in same window
    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('have.attr', 'target', '_self')
  })

  it('hides the Copy ID icon', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecord,
        externalLink: generatedLink,
        allowCopy: false,
      },
    })

    cy.getTestId('kui-icon-wrapper-external-link-icon').should('exist')
    cy.getTestId('entity-link-parent').find('.copy-uuid-tooltip').should('not.exist')

    // Ensure that link is set to open in same window
    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('have.attr', 'target', '_blank')
  })

  it('hides both the Copy ID and External Link icons', () => {
    cy.mount(EntityLink, {
      props: {
        entityLinkData: resolvedRecord,
        externalLink: generatedLink,
        allowCopy: false,
        newWindow: false,
      },
    })

    cy.getTestId('kui-icon-wrapper-external-link-icon').should('not.exist')
    cy.getTestId('entity-link-parent').find('.copy-uuid-tooltip').should('not.exist')

    // Ensure that link is set to open in same window
    cy.getTestId('entity-link-parent').find('a').should('exist')
    cy.getTestId('entity-link-parent').find('a').should('have.attr', 'target', '_self')
  })
})
