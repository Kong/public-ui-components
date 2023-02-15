// Cypress component test spec file

import AppNavbar from './AppNavbar.vue'

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

describe('<AppNavbar />', () => {
  describe('test all viewports', () => {
    Object.keys(viewports).forEach((viewportName: string) => {
      describe(`${viewportName} viewport`, {
        // Enforce the viewport size
        // @ts-ignore
        viewportHeight: viewports[viewportName].height, viewportWidth: viewports[viewportName].width,
      }, () => {
        const isDesktopViewport = viewportName === 'desktop'

        it('should render navbar and apply style values passed through props', () => {
          const topOffset = 10
          const leftOffset = 10
          const zIndex = '10'
          cy.mount(AppNavbar, {
            props: {
              topOffset,
              leftOffset,
              zIndex,
            },
          })

          cy.get('.kong-ui-app-navbar').should('have.css', 'top', `${topOffset}px`)
          cy.get('.kong-ui-app-navbar').should('have.css', 'z-index', zIndex)
          if (isDesktopViewport) {
            cy.get('.kong-ui-app-navbar').should('have.css', 'left', `${leftOffset}px`)
          }
        })

        it('should render content passed in through the default slot', () => {
          cy.mount(AppNavbar, {
            slots: {
              default: [
                '<span data-testid="navbar-default-slot-content">Content</span>',
              ],
            },
          })

          cy.get('[data-testid="navbar-default-slot-content"]').should('be.visible')
        })
      })
    })
  })

  describe('small screen only', {
    viewportHeight: viewports.tablet.height, viewportWidth: viewports.tablet.width,
  }, () => {
    it('should render content passed in through the mobile-logo slot', () => {
      cy.mount(AppNavbar, {
        slots: {
          'mobile-logo': [
            '<span data-testid="navbar-mobile-logo-slot-content">Mobile logo</span>',
          ],
        },
      })

      cy.get('[data-testid="navbar-mobile-logo-slot-content"]').should('be.visible')

      // Resize (downsize) the window viewport
      cy.viewport(viewports.mobile.width - 100, viewports.mobile.height)

      cy.get('[data-testid="navbar-mobile-logo-slot-content"]').should('be.visible')
    })

    it('should render content passed in through the mobile-sidebar-toggle slot', () => {
      cy.mount(AppNavbar, {
        slots: {
          'mobile-sidebar-toggle': [
            '<span data-testid="navbar-mobile-sidebar-toggle-slot-content">Toggle</span>',
          ],
        },
      })

      cy.get('[data-testid="navbar-mobile-sidebar-toggle-slot-content"]').should('be.visible')

      // Resize (downsize) the window viewport
      cy.viewport(viewports.mobile.width - 100, viewports.mobile.height)

      cy.get('[data-testid="navbar-mobile-sidebar-toggle-slot-content"]').should('be.visible')
    })
  })
})
