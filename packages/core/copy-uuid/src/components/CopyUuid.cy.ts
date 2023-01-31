// Cypress component test spec file

/* eslint-disable cypress/no-unnecessary-waiting */
import CopyUuid from './CopyUuid.vue'
import { COPY_UUID_NOTIFY_KEY } from '../const'
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

    cy.get(container).find('.uuid-icon path')
      .should('have.attr', 'fill', 'var(--black-45, rgba(0, 0, 0, 0.45))')
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

  it('renders with `isHidden` set to true', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        isHidden: true,
      },
    })

    cy.get(container).should('be.visible')

    cy.get(container).find('.uuid-container')
      .should('have.class', 'truncated-uuid')
      .should('have.class', 'mono')
      .should('contain.text', '**********')

    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
  })

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

  it('notify with isHidden', () => {
    const spy = cy.spy(window, 'alert')
    cy.mount(CopyUuid, {
      props: {
        uuid,
        isHidden: true,
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

  it('renders with `iconColor` set to var(--purple-400, #473cfb)', () => {
    cy.mount(CopyUuid, {
      props: {
        uuid,
        iconColor: 'var(--purple-400, #473cfb)',
      },
    })

    cy.get(container).should('be.visible')
    cy.get(container).find('.uuid-icon').should('be.visible')
    cy.get(container).find('[data-testid="copy-to-clipboard"]').should('be.visible')

    cy.get(container).find('.uuid-icon path')
      .should('have.attr', 'fill', 'var(--purple-400, #473cfb)')
  })
})
