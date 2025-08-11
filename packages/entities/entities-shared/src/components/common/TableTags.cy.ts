import TableTags from './TableTags.vue'

const tagsArray = ['tag1', 'tag2', 'tag3']
const tagsString = JSON.stringify(tagsArray)

const emptyArray = [] as string[]
const emptyString = '[]'
const nullString = 'null'

describe('<TableTags />', () => {
  it('renders normal array correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: tagsArray,
      },
    })

    cy.get('.k-truncate').should('exist')
    cy.get('.k-badge').should('have.length', tagsArray.length)
  })

  it('renders JSON string correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: tagsString,
      },
    })

    cy.get('.k-truncate').should('exist')
    cy.get('.k-badge').should('have.length', tagsArray.length)
  })

  it('renders empty array correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: emptyArray,
      },
    })

    cy.get('.k-truncate').should('not.exist')
    cy.get('.k-badge').should('not.exist')
    cy.get('span').should('have.text', '-')
  })

  it('renders empty string correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: emptyString,
      },
    })

    cy.get('.k-truncate').should('not.exist')
    cy.get('.k-badge').should('not.exist')
    cy.get('span').should('have.text', '-')
  })

  it('renders null string correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: nullString,
      },
    })

    cy.get('.k-truncate').should('not.exist')
    cy.get('.k-badge').should('not.exist')
    cy.get('span').should('have.text', '-')
  })

  it('renders tag max width correctly', () => {
    cy.mount(TableTags, {
      props: {
        tags: tagsArray,
        tagMaxWidth: '100',
      },
    })

    cy.get('.k-truncate').should('exist')
    cy.get('.badge-content').should('have.css', 'max-width', '100px')
  })
})
