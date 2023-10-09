import ErrorBoundary from './ErrorBoundary.vue'
import ErrorBoundaryPlugin from '../../src'
import { h, ref } from 'vue'
import type { App } from 'vue'
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
      it('accepts an array of tags that are returned as part of the `context`', () => {
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

      it('injects the tags of a parent `ErrorBoundary` component and combines them with any tags passed as props', () => {
        const fallbackContentId = 'fallback-slot-content'
        const parentTags = ['first-parent', 'second-parent', 'third-parent']
        const childTags = ['first-child', 'second-child']
        const payloadData = ref<ErrorBoundaryCallbackParams>()

        cy.mount(ErrorBoundary, {
          components: {
            ErrorBoundary,
          },
          props: {
            tags: parentTags,
          },
          slots: {
            default: () => h(ErrorBoundary, {
              tags: childTags,
            },
            {
              default: () => h(TestErrorComponent, {
                error: false, // normal state by default
              }),
              fallback: (payload: ErrorBoundaryCallbackParams) => {
                // Store the error and context data
                payloadData.value = payload

                return h('p', { 'data-testid': fallbackContentId }, payload.context.tags.join(' '))
              },
            }),
          },
        }).then(({ wrapper }) => wrapper).as('vueWrapper')

        // Trigger an error
        cy.getTestId('force-error-button').click()

        cy.get('@vueWrapper').then(() => {
          expect(payloadData.value?.context.tags.length).to.eq([...parentTags, ...childTags].length)

          // Ensure all parent and child tags are present
          for (const tag of [...parentTags, ...childTags]) {
            expect(payloadData.value?.context.tags).to.include(tag)
          }
        })
      })
    })

    describe('onError', () => {
      it('executes the `onError` callback and provides the callback params when an error is captured', () => {
        const payloadData = ref<ErrorBoundaryCallbackParams>()
        const tags = ['first-tag', 'second-tag', 'third-tag']
        // Spy on the console for the onError callback
        cy.spy(console, 'log').as('consoleSpy')

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          props: {
            tags,
            onError: (params: ErrorBoundaryCallbackParams) => {
              payloadData.value = params
              console.log(payloadData.value)
            },
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

        cy.get('@vueWrapper').then(() => {
          // Ensure the component is removed from the DOM
          cy.getTestId('error-boundary-child-component').should('not.exist')
          cy.getTestId('normal-text').should('not.exist')
          cy.getTestId('force-error-button').should('not.exist')

          cy.get('@consoleSpy').should('be.calledOnceWith', payloadData.value)
        }).then(() => {
          expect(payloadData.value?.context.tags.length).to.eq(tags.length)
          // Ensure all tags are present
          for (const tag of tags) {
            expect(payloadData.value?.context.tags).to.include(tag)
          }
        })
      })

      it('executes the Vue plugin `onError` callback when provided', () => {
        const payloadData = ref<ErrorBoundaryCallbackParams>()
        const tags = ['first-tag', 'second-tag', 'third-tag']
        // Spy on the console for the onError callback
        cy.spy(console, 'log').as('consoleSpy')

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          props: {
            tags,
          },
          global: {
            plugins: [
              {
                install(app: App) {
                  app.use(ErrorBoundaryPlugin, {
                    onError: (params: ErrorBoundaryCallbackParams) => {
                      payloadData.value = params
                      console.log(payloadData.value)
                    },
                  })
                },
              },
            ],
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

        cy.get('@vueWrapper').then(() => {
          // Ensure the component is removed from the DOM
          cy.getTestId('error-boundary-child-component').should('not.exist')
          cy.getTestId('normal-text').should('not.exist')
          cy.getTestId('force-error-button').should('not.exist')

          cy.get('@consoleSpy').should('be.calledOnceWith', payloadData.value)
        }).then(() => {
          expect(payloadData.value?.context.tags.length).to.eq(tags.length)
          // Ensure all tags are present
          for (const tag of tags) {
            expect(payloadData.value?.context.tags).to.include(tag)
          }
        })
      })

      it('executes the prop `onError` callback when both the Vue plugin and prop callbacks are provided', () => {
        const pluginCallback = 'plugin'
        const propCallback = 'prop'
        // Spy on the console for the onError callback
        cy.spy(console, 'log').as('consoleSpy')

        cy.mount(ErrorBoundary, {
          components: {
            TestErrorComponent,
          },
          props: {
            onError: () => {
              console.log(propCallback)
            },
          },
          global: {
            plugins: [
              {
                install(app: App) {
                  app.use(ErrorBoundaryPlugin, {
                    onError: () => {
                      console.log(pluginCallback)
                    },
                  })
                },
              },
            ],
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

        cy.get('@vueWrapper').then(() => {
          // Ensure the component is removed from the DOM
          cy.getTestId('error-boundary-child-component').should('not.exist')
          cy.getTestId('normal-text').should('not.exist')
          cy.getTestId('force-error-button').should('not.exist')

          cy.get('@consoleSpy').should('be.calledOnceWith', propCallback)
        })
      })
    })
  })
})
