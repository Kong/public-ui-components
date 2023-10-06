import ErrorBoundary from './ErrorBoundary.vue'
import { h, ref } from 'vue'
// Import the BuggyComponent here for testing only
import TestErrorComponent from '../../cypress/TestErrorComponent.vue'
import type { ErrorBoundaryCallbackParams } from '../types'

describe('<ErrorBoundary />', () => {
  describe('slots', () => {
    describe('default', () => {
      it('renders default slot content', () => {
        const slotText = 'This is the content'

        cy.mount(ErrorBoundary, {
          slots: {
            default: () => h('div', { 'data-testid': 'default-slot-content' }, slotText),
          },
        })

        cy.getTestId('default-slot-content').should('be.visible')
        cy.getTestId('default-slot-content').should('contain.text', slotText)
      })

      it('hides default slot content when an error is captured and shows no other UI', () => {
        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          slots: {
            default: () => h(TestErrorComponent, {
              error: false, // ensure the component mounts without error
            }),
          },
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.getTestId('error-boundary-child-component').should('be.visible')
        cy.getTestId('normal-text').should('be.visible')

        // Trigger an error
        cy.getTestId('force-error-button').click()

        // Ensure the component is removed from the DOM
        cy.getTestId('error-boundary-child-component').should('not.exist')
        cy.getTestId('normal-text').should('not.exist')
        cy.getTestId('force-error-button').should('not.exist')
      })
    })

    describe('fallback', () => {
      it('hides default slot content and shows fallback slot content on error, when provided', () => {
        const fallbackContentId = 'fallback-slot-content'
        const fallbackText = 'This is the FALLBACK content'

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          slots: {
            default: () => h(TestErrorComponent, {
              error: false, // ensure the component mounts without error
            }),
            fallback: () => h('div', { 'data-testid': fallbackContentId }, fallbackText),
          },
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.getTestId('error-boundary-child-component').should('be.visible')

        // Trigger an error
        cy.getTestId('force-error-button').click()

        cy.getTestId('error-boundary-child-component').should('not.exist')
        cy.getTestId(fallbackContentId).should('be.visible').and('contain.text', fallbackText)
      })

      it('provides the `error` and `context` data to the fallback slot', () => {
        const fallbackContentId = 'fallback-slot-content'
        const tags = ['first-tag', 'second-tag']
        const payloadData = ref<ErrorBoundaryCallbackParams>()

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          props: {
            tags,
          },
          slots: {
            default: () => h(TestErrorComponent, {
              error: false, // ensure the component mounts without error
            }),
            fallback: (payload: ErrorBoundaryCallbackParams) => {
              // Store the error and context data
              payloadData.value = payload

              return h('p', { 'data-testid': fallbackContentId }, payload.context.tags.join(' '))
            },
          },
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.get('@vueWrapper').then(() => {
          cy.getTestId('error-boundary-child-component').should('be.visible')

          // Trigger an error
          cy.getTestId('force-error-button').click()

          cy.getTestId('error-boundary-child-component').should('not.exist')

          for (const tag of tags) {
            cy.getTestId(fallbackContentId).should('be.visible').and('contain.text', tag)
          }
        }).then(() => {
          expect(payloadData.value?.error).not.to.eq('undefined')
          expect(payloadData.value?.context.source).to.eq('ErrorBoundary')
          expect(payloadData.value?.context.tags.length).to.eq(tags.length)
          // Ensure all tags are present
          for (const tag of tags) {
            expect(payloadData.value?.context.tags).to.include(tag)
          }
        })
      })
    })
  })

  describe('props', () => {
    describe('tags', () => {
      it('accepts an array of tag strings that should be returned as part of the `context`', () => {
        const fallbackContentId = 'fallback-slot-content'
        const tags = ['first-tag', 'second-tag', 'third-tag']
        const payloadData = ref<ErrorBoundaryCallbackParams>()

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          props: {
            tags,
          },
          slots: {
            default: () => h(TestErrorComponent, {
              error: true, // force an error
            }),
            fallback: (payload: ErrorBoundaryCallbackParams) => {
              // Store the error and context data
              payloadData.value = payload

              return h('p', { 'data-testid': fallbackContentId }, payload.context.tags.join(' '))
            },
          },
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        cy.get('@vueWrapper').then(() => {
          expect(payloadData.value?.context.tags.length).to.eq(tags.length)

          // Ensure all tags are present
          for (const tag of tags) {
            expect(payloadData.value?.context.tags).to.include(tag)
          }
        })
      })

      it.skip('injects the tags of a parent `ErrorBoundary` component and combines them with any tags passed as props')
    })

    describe('onError', () => {
      it.skip('executes the `onError` callback when an error is captured')
      it.skip('executes the plugin-provided `onError` callback (instead of the prop) when provided and an error is captured')
    })
  })
})
