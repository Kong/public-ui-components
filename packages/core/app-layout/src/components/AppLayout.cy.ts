// Cypress component test spec file

import AppLayout from './AppLayout.vue'

const viewports = {
  desktop: {
    width: 1024, // Desktop is 1024px and higher
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

const renderDefaultSlot = (hideDefaultSlot: boolean = false) => {
  cy.mount(AppLayout, {
    props: {
      hideDefaultSlot,
    },
    slots: {
      default: [
        '<span data-testid="app-layout-default-slot-content">Default</span>',
      ],
    },
  })
}

describe('<AppLayout />', () => {
  describe('test different viewport sizes', {
    viewportHeight: viewports.desktop.height, viewportWidth: viewports.desktop.width,
  }, () => {
    it('should display sidebar on large screen and hide on small', () => {
      cy.mount(AppLayout)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('be.visible')

      // Resize (downsize) the window viewport
      cy.viewport(viewports.mobile.width - 100, viewports.mobile.height)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('not.be.visible')
    })

    it('should show overlay on small screen and hide it on large', () => {
      cy.mount(AppLayout)
      // Resize (downsize) the window viewport
      cy.viewport(viewports.tablet.width, viewports.tablet.height)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('not.be.visible')

      cy.get('.sidebar-menu-toggle').should('be.visible').click()

      cy.get('.kong-ui-app-sidebar-overlay').should('be.visible')

      // Resize (increase) the window viewport
      cy.viewport(viewports.desktop.width, viewports.desktop.height)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('be.visible')

      cy.get('.kong-ui-app-sidebar-overlay').should('not.be.visible')
    })
  })

  describe('slots', () => {
    describe('test all viewports', () => {
      Object.keys(viewports).forEach((viewportName: string) => {
        describe(`${viewportName} viewport`, {
          // Enforce the viewport size
          // @ts-ignore
          viewportHeight: viewports[viewportName].height, viewportWidth: viewports[viewportName].width,
        }, () => {
          it('should render content passed in through notification slot', () => {
            cy.mount(AppLayout, {
              slots: {
                notification: [
                  '<KAlert data-testid="app-layout-notification-slot-content" appearance="danger" alert-message="Notification"></KAlert>',
                ],
              },
            })

            cy.get('[data-testid="app-layout-notification-slot-content"]').should('be.visible')
          })

          it('should render content passed in through navbar left slot', () => {
            cy.mount(AppLayout, {
              slots: {
                'navbar-left': [
                  '<span data-testid="app-layout-navbar-left-slot-content">Navbar</span>',
                ],
              },
            })

            cy.get('[data-testid="app-layout-navbar-left-slot-content"]').should('be.visible')
          })

          it('should render content passed in through navbar center slot', () => {
            cy.mount(AppLayout, {
              slots: {
                'navbar-center': [
                  '<span data-testid="app-layout-navbar-center-slot-content">Navbar</span>',
                ],
              },
            })

            cy.get('[data-testid="app-layout-navbar-center-slot-content"]').should('be.visible')
          })

          it('should render content passed in through navbar right slot', () => {
            cy.mount(AppLayout, {
              slots: {
                'navbar-right': [
                  '<span data-testid="app-layout-navbar-right-slot-content">Navbar</span>',
                ],
              },
            })

            cy.get('[data-testid="app-layout-navbar-right-slot-content"]').should('be.visible')
          })

          it('should render content passed in through app-error slot', () => {
            cy.mount(AppLayout, {
              slots: {
                'app-error': [
                  '<span data-testid="app-layout-app-error-slot-content">Error</span>',
                ],
              },
            })

            cy.get('[data-testid="app-layout-app-error-slot-content"]').should('be.visible')
          })

          it('should render content passed in through default slot', () => {
            renderDefaultSlot()

            cy.get('[data-testid="app-layout-default-slot-content"]').should('be.visible')
          })
        })
      })
    })

    describe('mobile only', {
      viewportHeight: viewports.mobile.height, viewportWidth: viewports.mobile.width,
    }, () => {
      it('should render content passed in through navbar-mobile-logo slot', () => {
        cy.mount(AppLayout, {
          slots: {
            'navbar-mobile-logo': [
              '<span data-testid="app-layout-navbar-mobile-logo-slot-content">Mobile logo</span>',
            ],
          },
        })

        cy.get('[data-testid="app-layout-navbar-mobile-logo-slot-content"]').should('be.visible')
      })

      it('should not have a top-left border-radius on the main content container', () => {
        cy.mount(AppLayout)

        cy.get('[data-testid="kong-ui-app-layout-main"]').should('have.css', 'border-top-left-radius').and('eq', '0px')
      })
    })

    describe('desktop only', {
      viewportHeight: viewports.desktop.height, viewportWidth: viewports.desktop.width,
    }, () => {
      it('should render content passed in through sidebar-header slot', () => {
        cy.mount(AppLayout, {
          slots: {
            'sidebar-header': [
              '<span data-testid="app-layout-sidebar-header-slot-content">Sidebar header</span>',
            ],
          },
        })

        cy.get('[data-testid="app-layout-sidebar-header-slot-content"]').should('be.visible')
      })

      it('should render content passed in through sidebar-top slot', () => {
        cy.mount(AppLayout, {
          slots: {
            'sidebar-top': [
              '<span data-testid="app-layout-sidebar-top-slot-content">Sidebar top</span>',
            ],
          },
        })

        cy.get('[data-testid="app-layout-sidebar-top-slot-content"]').should('be.visible')
      })

      it('should render content passed in through sidebar-footer slot', () => {
        cy.mount(AppLayout, {
          slots: {
            'sidebar-footer': [
              '<span data-testid="app-layout-sidebar-footer-slot-content">Sidebar footer</span>',
            ],
          },
        })

        cy.get('[data-testid="app-layout-sidebar-footer-slot-content"]').should('be.visible')
      })

      it('should have a top-left border-radius on the main content container', () => {
        cy.mount(AppLayout)

        cy.get('[data-testid="kong-ui-app-layout-main"]').should('have.css', 'border-top-left-radius').and('eq', '4px')
      })
    })
  })

  describe('props', () => {
    describe('desktop', {
      viewportHeight: viewports.desktop.height, viewportWidth: viewports.desktop.width,
    }, () => {
      it('should not render default slot if hideDefaultSlot prop is true', () => {
        renderDefaultSlot(true)

        cy.get('[data-testid="app-layout-default-slot-content"]').should('not.exist')
      })

      it('should not render navbar if navbarHidden prop is true', () => {
        cy.mount(AppLayout, {
          props: {
            navbarHidden: true,
          },
        })

        cy.get('.kong-ui-app-navbar').should('not.exist')
      })

      it('should not render sidebar if sidebarHidden prop is true', () => {
        cy.mount(AppLayout, {
          props: {
            sidebarHidden: true,
          },
        })

        cy.get('.kong-ui-app-sidebar').should('not.exist')
      })
    })

    describe('mobile only', {
      viewportHeight: viewports.mobile.height, viewportWidth: viewports.mobile.width,
    }, () => {
      it('should render sidebar open when sidebarOpen prop is true', () => {
        cy.mount(AppLayout, {
          props: {
            sidebarOpen: true,
          },
        })

        cy.get('.kong-ui-app-sidebar.sidebar-open').should('be.visible')
      })
    })
  })

  describe('window resize', {
    viewportHeight: viewports.tablet.height, viewportWidth: viewports.tablet.width,
  }, () => {
    it('should automatically close the sidebar on window resize', () => {
      cy.mount(AppLayout)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('not.be.visible')

      // Open the sidebar
      cy.get('.sidebar-menu-toggle').should('be.visible').click()
      cy.get('.kong-ui-app-sidebar').should('be.visible')

      // Resize (downsize) the window viewport width
      cy.viewport(viewports.tablet.width - 20, viewports.tablet.height)

      cy.get('.kong-ui-app-navbar').should('be.visible')
      cy.get('.kong-ui-app-sidebar').should('not.be.visible')
    })
  })
})
