// Cypress component test spec file

import AppSidebar from './AppSidebar.vue'
import { h } from 'vue'
import { topItems, bottomItems, profileItems } from '../../../fixtures/sidebar-items'

const viewports = {
  desktop: {
    width: 768, // Desktop is 768px and higher
    height: 750,
  },
  tablet: {
    width: 767, // Tablet is 767px - 640px
    height: 750,
  },
  mobile: {
    width: 639, // Mobile is 639px and lower
    height: 750,
  },
}

describe('<AppSidebar />', () => {
  describe('test all viewports', () => {
    beforeEach(() => {
      // Remove the window resize event listener
      cy.stub(window, 'addEventListener').returns({})
    })

    // Run all child tests for Desktop and Mobile viewports
    Object.keys(viewports).forEach((viewportName: string) => {
      describe(`${viewportName} viewport`, {
        // Enforce the viewport size
        // @ts-ignore
        viewportHeight: viewports[viewportName].height, viewportWidth: viewports[viewportName].width,
      }, () => {
        it('renders a sidebar with top, bottom, and profile nav', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems,
              bottomItems,
              profileItems,
              profileName: 'Marty McFly',
              headerHeight: 0,
            },
          })

          cy.get('.kong-ui-app-sidebar').should('be.visible')

          cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.top-items').find('li a').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').find('li a').should('be.visible')

          cy.get('.sidebar-profile-menu').should('be.visible')
          cy.get('.profile-dropdown-trigger').should('be.visible')
        })

        it('renders a router-link if item.to is an object', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Organization',
                key: 'organization',
                to: { name: 'organization' }, // Route must be defined in `cypress/fixtures/routes.ts`
                icon: 'organizations',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('have.class', 'router-link')
        })

        it('renders an anchor tag if item.to is a string that starts with `http`', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Organization',
                key: 'organization',
                to: 'https://google.com',
                icon: 'organizations',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
        })

        it('renders an anchor tag if item.external is true', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Organization',
                key: 'organization',
                to: '/organizations',
                external: true,
                icon: 'organizations',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
        })

        it('navigates via anchor tag if item.external is true', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Organization',
                key: 'organization',
                to: '/organizations',
                external: true,
                icon: 'organizations',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
        })

        it('renders an anchor tag and sets target="_blank" if item.newWindow is true, item.external is true, and item.to is a string', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Mesh',
                key: 'mesh',
                to: '/mesh/',
                newWindow: true,
                external: true,
                icon: 'info',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('have.attr', 'target', '_blank')
        })

        it('renders an anchor tag and sets target="_blank" if item.newWindow is true, item.external is false, and item.to is a string', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Mesh',
                key: 'mesh',
                to: '/mesh/',
                newWindow: true,
                external: false,
                icon: 'info',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('have.attr', 'target', '_blank')
        })

        it('only renders a single anchor tag if item.newWindow is true', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Mesh',
                key: 'mesh',
                to: '/mesh/',
                newWindow: true,
                external: false,
                icon: 'info',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('not.have.class', 'router-link')
          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-primary a').should('have.length', 1)
        })

        it('only renders a single anchor tag when using a router-link', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Organization',
                key: 'organization',
                to: { name: 'organization' }, // Route must be defined in `cypress/fixtures/routes.ts`
                icon: 'organizations',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').should('have.class', 'router-link')
          cy.get('.kong-ui-app-sidebar').find('.sidebar-item-primary a').should('have.length', 1)
        })

        // Top items
        describe('top items', () => {
          it('renders top nav items', () => {
            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems,
              },
            })

            cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
            cy.get('.kong-ui-app-sidebar').find('ul.top-items').find('li').should('be.visible')
          })
        })

        // Bottom items
        describe('bottom items', () => {
          it('renders bottom nav items', () => {
            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                bottomItems,
              },
            })

            cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')
            cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').find('li').should('be.visible')
          })
        })

        // Profile items
        describe('profile items', () => {
          it('does not render the profile item if no profileItems or profileName are passed', () => {
            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems,
                bottomItems,
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.sidebar-footer').should('not.exist')
          })

          it('renders just the profileName if no nav items are passed', () => {
            const name = 'Marty McFly'

            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                profileName: name,
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.sidebar-profile-name').should('contain.text', name)
            cy.get('.profile-dropdown-trigger').should('not.exist')
            cy.get('.sidebar-profile-menu-popover').should('not.exist')
          })

          it('displays the profile menu popup when clicked', () => {
            const name = 'Marty McFly'

            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                profileItems,
                profileName: name,
              },
            })

            cy.get('.profile-dropdown-trigger').click()
            cy.get('.sidebar-profile-menu-popover').should('be.visible')
          })

          it('renders profile nav items in popover', () => {
            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                profileItems,
              },
            })

            cy.get('.sidebar-profile-menu').should('be.visible')
            cy.get('.profile-dropdown-trigger').should('be.visible')

            cy.get('.profile-dropdown-trigger').click()

            cy.get('.sidebar-profile-menu-popover').should('be.visible')
            cy.get('.sidebar-profile-menu-popover').find('.k-dropdown-item').should('have.length', 2)
          })
        })

        it('displays a divider if top items and bottom items are present', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems,
              bottomItems,
            },
          })

          cy.get('.sidebar-level-divider').should('be.visible')
        })

        it('should not display a divider if only one of either top or bottom items are present', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems,
            },
          })

          cy.get('.sidebar-level-divider').should('not.exist')
        })

        it('displays a badge count if present for L2 items when the parent item is expanded', () => {
          const badgeCount = 27

          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Runtime Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
                icon: 'runtimes',
                items: [
                  {
                    name: 'Runtime Instances',
                    to: '/?runtime-instances',
                    badgeCount,
                    active: true,
                  },
                ],
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.level-secondary').should('be.visible')
          cy.get('.level-secondary').find('.item-badge').should('contain.text', badgeCount)
        })

        it('adds a testId attribute when provided', () => {
          const testIdL1 = 'l1-custom-test-selector'
          const testIdL2 = 'l2-custom-test-selector'

          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Runtime Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
                icon: 'runtimes',
                testId: testIdL1,
                items: [
                  {
                    name: 'Runtime Instances',
                    to: '/?runtime-instances',
                    testId: testIdL2,
                    active: true,
                  },
                ],
              }],
            },
          })

          cy.getTestId('sidebar-item-' + testIdL1).should('be.visible')
          cy.getTestId('sidebar-item-' + testIdL2).should('be.visible')
        })

        it('renders an icon next to L1 items when provided', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Runtime Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
                icon: 'runtimes',
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-icon .kong-icon').should('be.visible')
        })

        it('does not render an icon next to L1 items when not provided', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Runtime Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-icon .kong-icon').should('not.exist')
        })

        // Expanded
        describe('expanded', () => {
          it('displays L2 items when the parent item `expanded` is true', () => {
            const childItemName = 'Runtime Instances'

            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems: [{
                  name: 'Runtime Manager',
                  to: '/?runtime-manager',
                  label: 'retail-sandbox-rg',
                  key: 'runtime-manager',
                  active: true,
                  expanded: true,
                  icon: 'runtimes',
                  items: [
                    {
                      name: childItemName,
                      to: '/?runtime-instances',
                      active: true,
                    },
                  ],
                }],
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.level-secondary').should('be.visible')
            cy.get('.level-secondary').find('li a').eq(0).should('contain.text', childItemName)
          })

          it('displays a label under the L1 when provided and expanded', () => {
            const labelText = 'retail-sandbox-rg'

            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems: [{
                  name: 'Runtime Manager',
                  to: '/?runtime-manager',
                  label: labelText,
                  key: 'runtime-manager',
                  active: true,
                  expanded: true,
                  icon: 'runtimes',
                  items: [
                    {
                      name: 'Runtime Instances',
                      to: '/?runtime-instances',
                      active: true,
                    },
                  ],
                }],
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-label').should('contain.text', labelText)
          })

          it('does not display a label under the L1 when the item is not expanded', () => {
            const labelText = 'retail-sandbox-rg'

            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems: [{
                  name: 'Runtime Manager',
                  to: '/?runtime-manager',
                  label: labelText,
                  key: 'runtime-manager',
                  active: true,
                  expanded: false,
                  icon: 'runtimes',
                  items: [
                    {
                      name: 'Runtime Instances',
                      to: '/?runtime-instances',
                      active: true,
                    },
                  ],
                }],
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
            cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-label').should('not.exist')
          })
        })

        // Events
        describe('events', () => {
          it('emits a `click` event with an `item` payload when clicked', () => {
            cy.mount(AppSidebar, {
              props: {
                open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                mobileEnabled: true,
                topItems,
              },
            })

            cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').eq(1).click().then(() => {
              // Check for emitted event
              cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'click').then((evt) => {
                // Verify emit payload
                cy.wrap(evt[0][0]).should('have.property', 'name')
                cy.wrap(evt[0][0]).should('have.property', 'key')
                cy.wrap(evt[0][0]).should('have.property', 'to')
                cy.wrap(evt[0][0]).should('have.property', 'icon')
                cy.wrap(evt[0][0]).should('have.property', 'testId')
              })
            })
          })
        })

        // Slots
        describe('slots', () => {
          // Header slot
          describe('header', () => {
            it('renders header slot content', () => {
              const headerSlotText = 'This is my logo'

              cy.mount(AppSidebar, {
                props: {
                  open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                  mobileEnabled: true,
                  mobileHeaderVisible: ['mobile', 'tablet'].includes(viewportName), // force mobile header to be visible
                  headerHeight: 100,
                },
                slots: {
                  header: () => h('div', {}, headerSlotText),
                },
              })

              cy.get('.sidebar-header').should('contain.text', headerSlotText)
            })

            it('sets the header height from the header-height prop', () => {
              const height = 120

              cy.mount(AppSidebar, {
                props: {
                  open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                  mobileEnabled: true,
                  headerHeight: height,
                },
                slots: {
                  header: () => h('div', {}, 'This is my logo'),
                },
              })

              cy.get('.sidebar-header').invoke('outerHeight').should('eq', height)
            })
          })

          describe('top', () => {
            it('renders top slot content', () => {
              const headerSlotText = 'This is my logo'
              const topSlotText = 'Top slot content'

              cy.mount(AppSidebar, {
                props: {
                  open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                  mobileEnabled: true,
                  mobileHeaderVisible: ['mobile', 'tablet'].includes(viewportName), // force mobile header to be visible
                  headerHeight: 100,
                },
                slots: {
                  header: () => h('div', {}, headerSlotText),
                  top: () => h('div', {}, topSlotText),
                },
              })

              cy.get('.sidebar-header').should('contain.text', headerSlotText)
              cy.get('.sidebar-top').should('contain.text', topSlotText)
            })
          })
        })
      })
    })
  })

  describe('mobile-only', () => {
    describe('window events', {
      viewportHeight: viewports.tablet.height,
      viewportWidth: viewports.tablet.width,
    }, () => {
      it('closes the mobile menu when the window is resized', () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true, // force mobile sidebar to be open
            mobileEnabled: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('have.class', 'sidebar-open')
        cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items li').should('be.visible')

        // Resize (downsize) the window viewport
        cy.viewport(viewports.mobile.width - 100, viewports.mobile.height)

        cy.get('.kong-ui-app-sidebar').should('not.have.class', 'sidebar-open')
        cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items li').should('not.be.visible')
        cy.get('.kong-ui-app-sidebar').should('not.be.visible')
      })
    })

    describe('features', () => {
      beforeEach(() => {
        // Remove the window resize event listener
        cy.stub(window, 'addEventListener').returns({})
      })

      it('does not hide the sidebar off-screen when mobileEnabled is false', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            mobileEnabled: false,
            open: false,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('not.exist')
      })

      it('does not show the mobile sidebar when the open prop is set to false', () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: false,
            mobileEnabled: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('not.be.visible')
      })

      it('shows the mobile sidebar when the open prop is set to true', () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
      })

      it('hides the header slot when mobileHeaderVisible prop is false', () => {
        const headerSlotText = 'This is my logo'

        cy.mount(AppSidebar, {
          props: {
            open: true, // force mobile sidebar to be open
            mobileEnabled: true,
            mobileHeaderVisible: false,
            headerHeight: 100,
            topItems,
            bottomItems,
            profileItems,
          },
          slots: {
            header: () => h('div', {}, headerSlotText),
          },
        })

        cy.get('.kong-ui-app-sidebar').find('.sidebar-header').should('contain.text', headerSlotText)
        cy.get('.kong-ui-app-sidebar').find('.sidebar-header').should('not.be.visible')
      })

      it('emits a `toggle` event with a `false` payload when the mobile sidebar is closed', () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').eq(1).click().then(() => {
          // Check for emitted event when the sidebar is closed
          cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'toggle').then((evt) => {
            // Verify emit payload
            cy.wrap(evt[0][0]).should('eq', false)
          })

          cy.wrap(Cypress.vueWrapper.setProps({ open: true })).then(() => {
            cy.get('.kong-ui-app-sidebar').should('be.visible')
          })
        })
      })

      it('waits to auto-close the sidebar based on the time specified by the `mobileCloseDelay` prop', () => {
        const delay = 3000

        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            mobileCloseDelay: delay,
          },
        })

        cy.clock(new Date())

        cy.get('.kong-ui-app-sidebar').should('be.visible')

        cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').eq(1).click().then(() => {
          // Move the clock forward 1 second
          cy.tick(1000)
          // Sidebar should still be visible
          cy.get('.kong-ui-app-sidebar').should('be.visible')
          // Move the clock forward 1 second
          cy.tick(1000)
          // Sidebar should still be visible
          cy.get('.kong-ui-app-sidebar').should('be.visible')
          // Move the clock forward almost 1 second
          cy.tick(900)
          // Sidebar should still be visible
          cy.get('.kong-ui-app-sidebar').should('be.visible')
          // Move the clock forward 101 milliseconds
          cy.tick(101)
          // Sidebar should no longer be visible
          cy.get('.kong-ui-app-sidebar').should('not.be.visible')
        })
      })

      it('shows the overlay when the mobileOverlay prop is set to true', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            mobileOverlay: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('be.visible')
      })

      it('does not show the overlay when the mobileOverlay prop is set to false', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            mobileOverlay: false,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('not.exist')
      })

      it('does not show the overlay when the sidebar is not open', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: false,
            mobileEnabled: true,
            mobileOverlay: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('not.be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('not.exist')
      })

      it('does not show the overlay when mobileEnabled is false', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: false,
            mobileEnabled: false,
            mobileOverlay: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('not.exist')
      })

      it('closes the sidebar when a user clicks on the overlay', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').click()
        cy.get('.kong-ui-app-sidebar').should('not.be.visible')
      })

      it('does not close the sidebar when a user clicks on the overlay if mobileOverlayCloseOnClick is set to false', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            mobileOverlayCloseOnClick: false,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').click()
        cy.get('.kong-ui-app-sidebar').should('be.visible')
      })

      it('sets the sidebar zIndex based on the zIndex prop value', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        const zIndex = 22

        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            zIndex,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar').should('have.css', 'z-index', String(zIndex))
      })

      it('sets the sidebar overlay zIndex based on the mobileOverlayZIndex prop value', {
        viewportHeight: viewports.tablet.height,
        viewportWidth: viewports.tablet.width,
      }, () => {
        const mobileOverlayZIndex = 22

        cy.mount(AppSidebar, {
          props: {
            topItems,
            open: true,
            mobileEnabled: true,
            zIndex: mobileOverlayZIndex + 1,
            mobileOverlayZIndex,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('be.visible')
        cy.get('.kong-ui-app-sidebar-overlay').should('have.css', 'z-index', String(mobileOverlayZIndex))
      })
    })
  })
})
