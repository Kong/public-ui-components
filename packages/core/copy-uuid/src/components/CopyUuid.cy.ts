// Cypress component test spec file

/* eslint-disable cypress/no-unnecessary-waiting */
import CopyUuid from './CopyUuid.vue'
import { COPY_UUID_NOTIFY_KEY } from '../constants'
import type { CopyUuidNotifyParam } from '../types'

const uuid = '1234567890ABCDEFG'
const container = '.kong-ui-copy-uuid'

describe('<CopyUuid />', () => {
  it('renders with default props', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('have.class', 'truncated-uuid')
      .should('have.class', 'mono')
      .should('contain.text', uuid)

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')

    cy.get(container).find('.uuid-icon').should('have.css', 'color').and('eq', 'rgba(0, 0, 0, 0.45)')
  })

  it('renders with `truncated` set to false', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        truncated: false,
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('not.have.class', 'truncated-uuid')
      .should('have.class', 'mono')
      .should('contain.text', uuid)

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

  it('renders with `useMono` set to false', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        useMono: false,
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('have.class', 'truncated-uuid')
      .should('not.have.class', 'mono')
      .should('contain.text', uuid)

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

  it('renders with `format` set to `hidden`', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        format: 'hidden',
      },
    })

    cy.get(container).should('be.visible')
    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('[data-testid="copy-id"]').should('not.exist')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

  it('renders with `format` set to `redacted`', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        format: 'redacted',
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('have.class', 'truncated-uuid')
      .should('have.class', 'mono')
      .should('contain.text', '*****')

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

  it('renders with `format` set to `deleted`', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        format: 'deleted',
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('have.class', 'truncated-uuid')
      .should('have.class', 'mono')
      .should('contain.text', '*12345')

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

  describe('notify', () => {
    it('notify as a global provide', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid: '123',
        },
        global: {
          provide: {
            [COPY_UUID_NOTIFY_KEY]: (props: CopyUuidNotifyParam) => {
              window.alert(props.message)
            },
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith('"123" copied to clipboard')
      })
    })

    it('notify as a prop', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid: '123',
          notify: (props: CopyUuidNotifyParam) => {
            window.alert(props.message)
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith('"123" copied to clipboard')
      })
    })

    it('notify with format set to hidden', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid,
          format: 'hidden',
          notify: (props: CopyUuidNotifyParam) => {
            window.alert(props.message)
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith('Successfully copied to clipboard')
      })
    })

    it('notify with format set to redacted', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid,
          format: 'redacted',
          notify: (props: CopyUuidNotifyParam) => {
            window.alert(props.message)
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith('Successfully copied to clipboard')
      })
    })

    it('notify with format set to deleted', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid: '123',
          format: 'deleted',
          notify: (props: CopyUuidNotifyParam) => {
            window.alert(props.message)
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith('"123" copied to clipboard')
      })
    })

    it('notify with long uuid', () => {
      const spy = cy.spy(window, 'alert')
      cy.mount(CopyUuid, {
        props: {
          uuid,
          notify: (props: CopyUuidNotifyParam) => {
            window.alert(props.message)
          },
        },
      })

      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.wait(100).then(() => {
        expect(spy).to.be.calledWith(`"${uuid.substring(0, 15)}..." copied to clipboard`)
      })
    })
  })

  it('renders with `iconColor` set to rgb(71, 60, 251)', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        iconColor: 'rgb(71, 60, 251)',
      },
    })

    cy.get(container).should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')

    cy.get(container).find('.uuid-icon').should('have.css', 'color').and('eq', 'rgb(71, 60, 251)')
  })

  describe('tooltips', () => {
    it('renders with `tooltip` prop set', () => {
      const tooltipText = 'Click to copy'

      cy.mount(CopyUuid, {
        props: {
          uuid,
          tooltip: tooltipText,
        },
      })

      cy.get(container).should('be.visible')
      cy.get(container).find('.k-tooltip').should('exist')
      cy.get(container).find('.k-tooltip .k-popover-content').should('contain.text', tooltipText)
    })

    it('renders with `idTooltip` prop set', () => {
      const tooltipText = 'Custom tooltip text!'

      cy.mount(CopyUuid, {
        props: {
          uuid,
          idTooltip: tooltipText,
        },
      })

      cy.get(container).should('be.visible')
      cy.get(container).find('.k-tooltip').should('exist')
      cy.get(container).find('.k-tooltip .k-popover-content').should('contain.text', tooltipText)
    })

    it('renders `successTooltip` with `tooltip` prop set', () => {
      const tooltipText = 'Click to copy'
      const successText = 'Copied!'

      cy.mount(CopyUuid, {
        props: {
          uuid,
          tooltip: tooltipText,
          successTooltip: successText,
        },
      })

      cy.get(container).should('be.visible')
      cy.get(container).find('.k-tooltip').should('exist')
      cy.get(container).find('.k-tooltip .k-popover-content').should('contain.text', tooltipText)
      cy.get('[data-testid="copy-to-clipboard"]').click()
      cy.get(container).find('.k-tooltip .k-popover-content').should('contain.text', successText)
    })

    it('does not render `successTooltip` without `tooltip` prop set', () => {
      const successText = 'Copied!'

      cy.mount(CopyUuid, {
        props: {
          uuid,
          successTooltip: successText,
        },
      })

      cy.get(container).should('be.visible')
      cy.get(container).find('.k-tooltip').should('not.exist')
    })

    it('does not emit events when `successTooltip` prop is set', () => {
      cy.mount(CopyUuid, {
        props: {
          uuid,
          tooltip: 'Click to copy',
          successTooltip: 'Copied!',
        },
      })

      cy.get(container).should('be.visible')
      cy.get(container).find('.k-tooltip').should('exist')
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('[data-testid="copy-to-clipboard"]').click().then(() => {
        cy.wrap(Cypress.vueWrapper.emitted()).should('not.have.property', 'success')
      })
    })
  })

  it('emits event', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
      },
    })

    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('[data-testid="copy-to-clipboard"]').click().then(() => {
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'success').then((evt) => {
        // Verify emit payload
        cy.wrap(evt[0][0]).should('be.equal', uuid)
      })
    })
  })
})
