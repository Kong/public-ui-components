// fixme(zehao): this test cannot run without vite plugins in ../../vite.config.ts
// it gives an erroe when importing RouterPlayground
// it should be fixed after refactoring whole cypress tests configuration method, see the conversation in PR: 1497

// import RouterPlayground from './RouterPlayground.vue'

// describe('<RouterPlayground />', () => {
//   beforeEach(() => {
//     cy.viewport(800, 800)
//   })

//   it('should show router playground', () => {
//     cy.mount(RouterPlayground)

//     cy.getTestId('expression-header').should('be.visible')
//     cy.getTestId('expressions-editor').should('be.visible')
//     cy.getTestId('expressions-inspirations').should('be.visible')
//     cy.getTestId('requests-header').should('be.visible')
//     cy.getTestId('btn-commit').should('be.visible')
//     cy.getTestId('btn-import').should('be.visible')
//     cy.getTestId('empty-state-requests').should('be.visible')
//   })

//   it('initial expression', () => {
//     cy.mount(RouterPlayground, {
//       props: {
//         initialExpression: 'http.host == "localhost"',
//       },
//     })

//     cy.getTestId('expressions-editor').contains('http.host == "localhost"')
//     cy.getTestId('expressions-inspirations').should('not.exist')
//   })

//   it('inspirations', () => {
//     cy.mount(RouterPlayground)

//     cy.getTestId('btn-inspiration-0').click()
//     cy.getTestId('expressions-editor').contains('http.host == "localhost"')
//     cy.getTestId('btn-inspiration-0').should('not.exist')
//   })

//   it('expression changed', () => {
//     const onChangeSpy = cy.spy().as('onChangeSpy')
//     const onCommitSpy = cy.spy().as('onCommitSpy')
//     cy.mount(RouterPlayground, {
//       props: {
//         initialExpression: 'http.host == "localhost"',
//         onChange: onChangeSpy,
//         onCommit: onCommitSpy,
//       },
//     })
//     cy.get('.view-lines').type(' && http.method == "GET"')
//     cy.get('@onChangeSpy').should('have.been.calledWith', 'http.host == "localhost" && http.method == "GET"')

//     cy.getTestId('btn-commit').click()
//     cy.get('@onCommitSpy').should('have.been.calledWith', 'http.host == "localhost" && http.method == "GET"')
//   })

//   it('requests placeholder', () => {
//     cy.mount(RouterPlayground)

//     cy.getTestId('empty-state-requests').should('be.visible')
//   })

//   function addRequest({
//     url,
//     method,
//     headers,
//   }: {
//     url: string
//     method: string
//     headers?: Record<string, string>[]
//   }) {
//     cy.getTestId('btn-add-request').click()
//     cy.getTestId('url-input').should('be.visible')
//     cy.getTestId('url-input').type(url)

//     cy.get('#method').select(method)

//     if (headers?.length) {
//       headers.forEach((header, index) => {
//         cy.getTestId('keyname-input').type(header.key)
//         cy.getTestId('add-key').click()
//         cy.get(`:nth-child(${index + 3}) > .form-control`).type(header.value)
//       })
//     }

//     cy.getTestId('modal-action-button').click()
//   }

//   it('add/remove requests', () => {
//     cy.mount(RouterPlayground)

//     addRequest({
//       url: 'http://localhost:8000',
//       method: 'GET',
//       headers: [
//         { key: 'Foo', value: 'bar' },
//       ],
//     })

//     cy.get('.request-card').should('have.length', 1)
//     cy.get('.request-card').first().contains('http://localhost:8000')
//     cy.get('.request-card').first().find('.close-btn').click({ force: true })
//     cy.get('.request-card').should('not.exist')
//   })

//   it('matching requests', () => {
//     cy.mount(RouterPlayground)
//     const requestIds: string[] = []

//     addRequest({
//       url: 'http://localhost:8000',
//       method: 'GET',
//       headers: [
//         { key: 'Foo', value: 'bar' },
//       ],
//     })

//     addRequest({
//       url: 'https://www.konghq.com',
//       method: 'GET',
//     })

//     // eslint-disable-next-line cypress/unsafe-to-chain-command
//     cy.get('.request-card').each($card => {
//       requestIds.push($card.data('testid'))
//     }).then(() => {
//       cy.get('.view-lines').type('http.host == "localhost"')
//       cy.getTestId(requestIds[0]).should('have.class', 'active')
//       cy.getTestId(requestIds[1]).should('not.have.class', 'active')
//     })
//   })

//   it('cache requests', () => {
//     cy.clearAllLocalStorage()

//     cy.mount(RouterPlayground)

//     addRequest({
//       url: 'http://localhost:8000',
//       method: 'GET',
//     })

//     cy.mount(RouterPlayground)
//     cy.get('.request-card').should('have.length', 1)

//     cy.getTestId('clear-requests-link').click()
//     cy.getTestId('modal-action-button').click()

//     cy.mount(RouterPlayground)
//     cy.get('.request-card').should('not.exist')
//   })

//   const REQUESTS_TEXT = '[{"method":"POST","headers":{},"protocol":"http","host":"localhost","port":8080,"path":"/","id":"42eafd0a-287b-441d-b88f-f6fe4b44da0d"},{"method":"GET","headers":{},"protocol":"https","host":"konghq.com","port":443,"path":"/abc","id":"da8f04a9-c8c5-495d-a26c-f7bc132a3a64"}]'

//   it('import/export requests', () => {
//     cy.mount(RouterPlayground)
//     cy.getTestId('btn-import').click()
//     cy.getTestId('import-requests-editor').should('be.visible')
//     cy.getTestId('import-requests-editor').find('.view-lines').type(REQUESTS_TEXT, {
//       parseSpecialCharSequences: false,
//     })
//     cy.getTestId('modal-action-button').click()
//     cy.get('.request-card').should('have.length', 2)
//     cy.get('.request-card').first().contains('http://localhost:8080/')
//     cy.get('.request-card:nth-child(2)').contains('https://konghq.com/abc')

//     cy.window().then(() => {
//       // eslint-disable-next-line cypress/unsafe-to-chain-command
//       cy.getTestId('btn-export').focus().click()
//       cy.assertValueCopiedToClipboard(REQUESTS_TEXT)
//     })
//   })

// })

// // todo(zehao): add this to global commands
// // Cypress.Commands.add('assertValueCopiedToClipboard', value => {
// //   cy.window().then(win => {
// //     win.navigator.clipboard.readText().then(text => {
// //       expect(text).to.eq(value)
// //     })
// //   })
// // })
