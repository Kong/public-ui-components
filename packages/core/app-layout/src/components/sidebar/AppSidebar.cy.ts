// Cypress component test spec file

import AppSidebar from './AppSidebar.vue'
import { h } from 'vue'
import { topItems, bottomItems, groupedItems, groupConfig, groupCounts } from '../../../fixtures/sidebar-items'
import { RuntimesIcon } from '@kong/icons'

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

describe('<AppSidebar />', () => {
  before(() => {
    // Add background color
    document.documentElement.style.setProperty('--kong-ui-app-sidebar-background', 'linear-gradient(180deg, #001740 0%, #073382 100%)')
  })

  describe('test all viewports', () => {
    beforeEach(() => {
      // Remove the window resize event listener
      cy.stub(window, 'addEventListener').returns({})
    })

    // Run all child tests for Desktop and Mobile viewports
    Object.keys(viewports).forEach((viewportName: string) => {
      describe(`${viewportName} viewport`, {
        // Enforce the viewport size
        // @ts-ignore: string keys are valid
        viewportHeight: viewports[viewportName].height, viewportWidth: viewports[viewportName].width,
      }, () => {
        it('renders a sidebar with top and bottom nav', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems,
              bottomItems,
              headerHeight: 0,
            },
          })

          cy.get('.kong-ui-app-sidebar').should('be.visible')

          cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.top-items').find('li a').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').find('li a').should('be.visible')
        })

        it('renders a sidebar with top nav with non-collapsible groups', () => {
          const gc = {
            ...groupConfig,
          }
          // groups are not collapsible
          gc.connectivity.collapsible = false
          gc.applications.collapsible = false

          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: groupedItems,
              bottomItems,
              headerHeight: 0,
              groupConfig: gc,
            },
          })

          cy.get('.kong-ui-app-sidebar').should('be.visible')

          cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')

          // check for ungrouped records
          cy.getTestId('level-primary-group-collapse-ungrouped').should('be.visible')
          // classes
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'not-collapsible')
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'ungrouped')
          // item links
          cy.getTestId('level-primary-group-collapse-ungrouped').find('.sidebar-item-link').should('have.length', 1)
          // group name + collapse icon
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-name').should('not.exist')
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-collapse-icon').should('not.exist')

          // check for grouped records/group name
          Object.keys(gc).forEach((groupName) => {
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('be.visible')
            // classes
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('have.class', 'not-collapsible')
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('not.have.class', 'ungrouped')
            // item links
            cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('have.length', groupCounts[groupName as keyof typeof groupCounts] || 0)
            // default collapse state is ignored and items are visible
            cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            // group name
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').should('be.visible')
            // click does not collapse
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').click()
            cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            // collapse icon
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-collapse-icon').should('not.exist')
          })
        })

        it('renders a sidebar with top nav with collapsible groups', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: groupedItems,
              bottomItems,
              headerHeight: 0,
              groupConfig,
            },
          })

          cy.get('.kong-ui-app-sidebar').should('be.visible')

          cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')

          // check for ungrouped records
          cy.getTestId('level-primary-group-collapse-ungrouped').should('be.visible')
          // classes
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'not-collapsible')
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'ungrouped')
          // item links
          cy.getTestId('level-primary-group-collapse-ungrouped').find('.sidebar-item-link').should('have.length', 1)
          // group name + collapse icon
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-name').should('not.exist')
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-collapse-icon').should('not.exist')

          // check for grouped records/group name
          Object.keys(groupConfig).forEach((groupName) => {
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('be.visible')
            // classes
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('not.have.class', 'not-collapsible')
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('not.have.class', 'ungrouped')
            // item links
            cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('have.length', groupCounts[groupName as keyof typeof groupCounts] || 0)
            // default collapse state is applied
            if (groupConfig[groupName].collapsed) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('not.be.visible')
            } else {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            }
            // group name
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').should('be.visible')
            // click toggles collapse
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').click()
            if (groupConfig[groupName].collapsed) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            } else {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('not.be.visible')
            }
            // collapse icon
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-collapse-icon').should('be.visible')
          })
        })

        it('renders a sidebar with top nav with both collapsible and non-collapsible groups', () => {
          const gc = {
            ...groupConfig,
          }
          // connectivity is not collapsible
          gc.connectivity.collapsible = false

          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: groupedItems,
              bottomItems,
              headerHeight: 0,
              groupConfig: gc,
            },
          })

          cy.get('.kong-ui-app-sidebar').should('be.visible')

          cy.get('.kong-ui-app-sidebar').find('ul.top-items').should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('ul.bottom-items').should('be.visible')

          // check for ungrouped records
          cy.getTestId('level-primary-group-collapse-ungrouped').should('be.visible')
          // classes
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'not-collapsible')
          cy.getTestId('level-primary-group-collapse-ungrouped').should('have.class', 'ungrouped')
          // item links
          cy.getTestId('level-primary-group-collapse-ungrouped').find('.sidebar-item-link').should('have.length', 1)
          // group name + collapse icon
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-name').should('not.exist')
          cy.getTestId('level-primary-group-collapse-ungrouped').findTestId('level-primary-group-collapse-icon').should('not.exist')

          // check for grouped records/group name
          Object.keys(gc).forEach((groupName) => {
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('be.visible')

            // classes
            if (gc[groupName].collapsible) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).should('not.have.class', 'not-collapsible')
            } else {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).should('have.class', 'not-collapsible')
            }
            cy.getTestId(`level-primary-group-collapse-${groupName}`).should('not.have.class', 'ungrouped')

            // item links
            cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('have.length', groupCounts[groupName as keyof typeof groupCounts] || 0)

            // default collapse state is applied (or not)
            if (gc[groupName].collapsible && gc[groupName].collapsed) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('not.be.visible')
            } else {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            }
            // group name
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').should('be.visible')

            // click toggles collapse (or not)
            cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-name').click()
            if (gc[groupName].collapsible && gc[groupName].collapsed) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            } else if (gc[groupName].collapsible && !gc[groupName].collapsed) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('not.be.visible')
            } else if (!gc[groupName].collapsible) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).find('.sidebar-item-link').should('be.visible')
            }

            // collapse icon
            if (gc[groupName].collapsible) {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-collapse-icon').should('be.visible')
            } else {
              cy.getTestId(`level-primary-group-collapse-${groupName}`).findTestId('level-primary-group-collapse-icon').should('not.exist')
            }
          })
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
                name: 'Gateway Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
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
                name: 'Gateway Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
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
                name: 'Gateway Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
              }],
            },
            slots: {
              'sidebar-icon-runtime-manager': RuntimesIcon,
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-icon .kui-icon').should('be.visible')
        })

        it('does not render an icon next to L1 items when not provided', () => {
          cy.mount(AppSidebar, {
            props: {
              open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
              mobileEnabled: true,
              topItems: [{
                name: 'Gateway Manager',
                to: '/?runtime-manager',
                label: 'runtime-group-rg',
                key: 'runtime-manager',
                active: true,
                expanded: true,
              }],
            },
          })

          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('li').eq(0).should('be.visible')
          cy.get('.kong-ui-app-sidebar').find('.level-primary.top-items').find('.sidebar-item-icon .kui-icon').should('not.exist')
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
                  name: 'Gateway Manager',
                  to: '/?runtime-manager',
                  label: 'retail-sandbox-rg',
                  key: 'runtime-manager',
                  active: true,
                  expanded: true,
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
                  name: 'Gateway Manager',
                  to: '/?runtime-manager',
                  label: labelText,
                  key: 'runtime-manager',
                  active: true,
                  expanded: true,
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
                  name: 'Gateway Manager',
                  to: '/?runtime-manager',
                  label: labelText,
                  key: 'runtime-manager',
                  active: true,
                  expanded: false,
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

            // eslint-disable-next-line cypress/unsafe-to-chain-command
            cy.get('.kong-ui-app-sidebar').find('.sidebar-item-link').eq(1).click().then(() => {
              // Check for emitted event
              cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'click').then((evt) => {
                // Verify emit payload
                cy.wrap(evt[0][0]).should('have.property', 'name')
                cy.wrap(evt[0][0]).should('have.property', 'key')
                cy.wrap(evt[0][0]).should('have.property', 'to')
                cy.wrap(evt[0][0]).should('have.property', 'testId')
              })
            })
          })
        })

        // Slots
        describe('slots', () => {
          // header slot
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

          // top slot
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

          // footer slot
          describe('footer', () => {
            it('renders footer slot content', () => {
              const footerSlotText = 'This is my footer text'

              cy.mount(AppSidebar, {
                props: {
                  open: ['mobile', 'tablet'].includes(viewportName), // force mobile sidebar to be open
                  mobileEnabled: true,
                  mobileHeaderVisible: ['mobile', 'tablet'].includes(viewportName), // force mobile header to be visible
                  headerHeight: 100,
                },
                slots: {
                  footer: () => h('div', {}, footerSlotText),
                },
              })

              cy.get('.sidebar-footer').should('contain.text', footerSlotText)
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

        // eslint-disable-next-line cypress/unsafe-to-chain-command
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

        // eslint-disable-next-line cypress/unsafe-to-chain-command
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
