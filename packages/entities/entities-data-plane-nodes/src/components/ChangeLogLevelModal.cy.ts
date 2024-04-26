import { mockDataPlane } from '../fixtures/data-planes'
import { LogLevel } from '../types'
import ChangeLogLevelModal from './ChangeLogLevelModal.vue'

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

interface CLLModalInstanceWithLogLevel extends ArrayElement<InstanceType<typeof ChangeLogLevelModal>['$props']['instanceList']> {
  logLevel?: LogLevel
}

const LOG_LEVEL_DISPLAY_NAMES: Record<string, string> = {
  [LogLevel.Critical]: 'Critical',
  [LogLevel.Debug]: 'Debug',
  [LogLevel.Error]: 'Error',
  [LogLevel.Info]: 'Info',
  [LogLevel.Notice]: 'Notice',
  [LogLevel.Warn]: 'Warn',
}

describe('<ChangeLogLevelModal />', { viewportHeight: 700, viewportWidth: 700 }, () => {
  it('should render an empty list', () => {
    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList: [],
        instanceLogLevel: new Map(),
        requests: {
          getDataPlaneLogLevel: () => {},
          setDataPlaneLogLevel: () => {},
        },
      },
    })

    cy.getTestId('data-plane-node-list').should('be.visible')
    cy.getTestId('data-plane-node-list').find('tbody tr').should('have.length', 0)
    cy.getTestId('change-log-level-modal').find('.footer-actions button').should('be.disabled')
  })

  it('should render a list with all DPs without DLL capability', () => {
    const instanceList: CLLModalInstanceWithLogLevel[] = [
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: false },
    ]

    const getDataPlaneLogLevel = cy.stub()

    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList,
        instanceLogLevel: new Map(),
        requests: {
          getDataPlaneLogLevel,
          setDataPlaneLogLevel: () => {},
        },
      },
    })

    cy.getTestId('data-plane-node-list').should('be.visible')
    cy.getTestId('data-plane-node-list').find('tbody tr').should('have.length', 3)
    cy.getTestId('change-log-level-modal').find('.footer-actions button').should('be.disabled')

    for (const instance of instanceList) {
      cy.getTestId(`data-plane-node-list-row-${instance.id}`).as(`instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action').should('contain.text', 'N/A')
      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status').should('contain.text', 'Not Supported')
    }

    cy.wrap(getDataPlaneLogLevel).should('not.be.called')
  })

  it('should render correct formatted timeout', () => {
    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList: [],
        instanceLogLevel: new Map(),
        requests: {
          getDataPlaneLogLevel: () => {},
          setDataPlaneLogLevel: () => {},
        },
      },
    })

    cy.getTestId('log-level-timeout').clear()
    cy.getTestId('log-level-timeout-formatted').should('have.text', '')

    cy.getTestId('log-level-timeout').type('61')
    cy.getTestId('log-level-timeout-formatted').should('contain.text', '1 min 1 sec')

    cy.getTestId('log-level-timeout').clear()
    cy.getTestId('log-level-timeout').type('233')
    cy.getTestId('log-level-timeout-formatted').should('contain.text', '3 min 53 sec')

    cy.getTestId('log-level-timeout').clear()
    cy.getTestId('log-level-timeout').type('0')
    cy.getTestId('log-level-timeout').should('have.attr', 'aria-invalid')

    cy.getTestId('log-level-timeout').clear()
    cy.getTestId('log-level-timeout').type('-1')
    cy.getTestId('log-level-timeout').should('have.attr', 'aria-invalid')
  })

  it('should render correct list content', () => {
    const instanceList: CLLModalInstanceWithLogLevel[] = [
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Critical },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Debug },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Error },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Info },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Notice },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Warn },
    ]

    const getDataPlaneLogLevel = cy.spy(async (instanceId:string) => {
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      return instanceList.find(({ id }) => instanceId === id)?.logLevel
    })

    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList,
        instanceLogLevel: new Map(),
        requests: {
          getDataPlaneLogLevel,
          setDataPlaneLogLevel: () => {},
        },
      },
    })

    cy.getTestId('data-plane-node-list').should('be.visible')
    cy.getTestId('data-plane-node-list').find('tbody tr').should('have.length', instanceList.length)
    cy.getTestId('change-log-level-modal').find('.footer-actions button').should('be.enabled')

    for (const logLevel of Object.keys(LOG_LEVEL_DISPLAY_NAMES)) {
      cy.getTestId('log-level-select').click()
      cy.getTestId(`select-item-${logLevel}`).click()

      if (logLevel === LogLevel.Debug) {
        cy.getTestId('log-level-warning-message').should('be.visible')
      }

      for (const instance of instanceList) {
        cy.getTestId(`data-plane-node-list-row-${instance.id}`).as(`instanceRow_${instance.id}`).scrollIntoView()
        cy.get(`@instanceRow_${instance.id}`).should('be.visible')
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action-current-level')
          .should('contain.text', LOG_LEVEL_DISPLAY_NAMES[instance.logLevel!])
        if (instance.logLevel !== logLevel) {
          cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action-target-level')
            .should('contain.text', LOG_LEVEL_DISPLAY_NAMES[logLevel])
        }
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status').should('contain.text', 'Pending')
      }
    }
  })

  it('should render correct list with DPs without DLL capability', () => {
    const instanceList: CLLModalInstanceWithLogLevel[] = [
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Debug },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Error },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Info },
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Notice },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Warn },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Warn },
    ]

    const getDataPlaneLogLevel = cy.spy(async (instanceId:string) => {
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      return instanceList.find(({ id }) => instanceId === id)?.logLevel
    })

    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList,
        instanceLogLevel: new Map(),
        requests: {
          getDataPlaneLogLevel,
          setDataPlaneLogLevel: () => {},
        },
      },
    })

    for (const instance of instanceList) {
      cy.getTestId(`data-plane-node-list-row-${instance.id}`).as(`instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status')
        .should('contain.text', instance.hasDLLCapability ? 'Pending' : 'Not Supported')
    }

    cy.wrap(getDataPlaneLogLevel).should('have.callCount', 6)
    for (const instance of instanceList.filter((instance) => !instance.hasDLLCapability)) {
      cy.wrap(getDataPlaneLogLevel).should('not.have.been.calledWith', instance.id)
    }
  })

  it('should successfully change log level', () => {
    const instanceList: CLLModalInstanceWithLogLevel[] = [
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Debug },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Error },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Info },
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Notice },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Warn },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Warn },
    ]

    const instanceLogLevel = new Map<string, LogLevel>()

    const getDataPlaneLogLevel = cy.spy(async (instanceId:string) => {
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      return instanceList.find(({ id }) => instanceId === id)?.logLevel
    })

    const setDataPlaneLogLevel = cy.spy(async (instanceId: string, logLevel: LogLevel, revertAfter: number) => {
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      instanceLogLevel.set(instanceId, logLevel)
    })

    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList,
        instanceLogLevel,
        requests: {
          getDataPlaneLogLevel,
          setDataPlaneLogLevel,
        },
      },
    })

    for (const instance of instanceList) {
      cy.getTestId(`data-plane-node-list-row-${instance.id}`).as(`instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status')
        .should('contain.text', instance.hasDLLCapability ? 'Pending' : 'Not Supported')
    }

    cy.wrap(getDataPlaneLogLevel).should('have.callCount', 6)

    for (const instance of instanceList.filter((instance) => !instance.hasDLLCapability)) {
      cy.wrap(getDataPlaneLogLevel).should('not.have.been.calledWith', instance.id)
    }

    cy.getTestId('change-log-level-modal').find('.footer-actions button').should('be.enabled').click()

    for (const instance of instanceList) {
      cy.get(`@instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      if (instance.hasDLLCapability) {
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action-current-level')
          .should('contain.text', 'Notice')
      } else {
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action')
          .should('contain.text', 'N/A')
      }

      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status')
        .should('contain.text', instance.hasDLLCapability ? 'Succeed' : 'Not Supported')
    }

    for (const instance of instanceList) {
      cy.wrap(setDataPlaneLogLevel).should(
        instance.hasDLLCapability ? 'have.been.calledWith' : 'not.have.been.calledWith',
        instance.id,
        LogLevel.Notice,
      )
    }
  })

  it('should partially change log level', () => {
    const instanceList: CLLModalInstanceWithLogLevel[] = [
      { ...mockDataPlane(), hasDLLCapability: false },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Debug },
      { ...mockDataPlane(), hasDLLCapability: true, logLevel: LogLevel.Error },
    ]

    const instanceLogLevel = new Map<string, LogLevel>()

    const getDataPlaneLogLevel = cy.spy(async (instanceId:string) => {
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      return instanceList.find(({ id }) => instanceId === id)?.logLevel
    })

    const setDataPlaneLogLevel = cy.spy(async (instanceId: string, logLevel: LogLevel, revertAfter: number) => {
      if (instanceId === instanceList[instanceList.length - 1].id) {
        throw new Error('Failed to change log level')
      }
      await new Promise((resolve) => setTimeout(resolve, 100 + 500 * Math.random()))
      instanceLogLevel.set(instanceId, logLevel)
    })

    cy.mount(ChangeLogLevelModal, {
      props: {
        visible: true,
        instanceList,
        instanceLogLevel,
        requests: {
          getDataPlaneLogLevel,
          setDataPlaneLogLevel,
        },
      },
    })

    for (const instance of instanceList) {
      cy.getTestId(`data-plane-node-list-row-${instance.id}`).as(`instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status')
        .should('contain.text', instance.hasDLLCapability ? 'Pending' : 'Not Supported')
    }

    for (const instance of instanceList.filter((instance) => !instance.hasDLLCapability)) {
      cy.wrap(getDataPlaneLogLevel).should('not.have.been.calledWith', instance.id)
    }

    cy.getTestId('change-log-level-modal').find('.footer-actions button').should('be.enabled').click()

    for (const instance of instanceList) {
      cy.get(`@instanceRow_${instance.id}`).scrollIntoView()
      cy.get(`@instanceRow_${instance.id}`).should('be.visible')
      if (instance.hasDLLCapability) {
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action-current-level')
          .should('contain.text', instance.id === instanceList[instanceList.length - 1].id
            ? LOG_LEVEL_DISPLAY_NAMES[instanceList[instanceList.length - 1].logLevel!]
            : 'Notice')
      } else {
        cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-action')
          .should('contain.text', 'N/A')
      }

      cy.get(`@instanceRow_${instance.id}`).findTestId('log-change-status')
        .should('contain.text', instance.id === instanceList[instanceList.length - 1].id
          ? 'Failure'
          : instance.hasDLLCapability
            ? 'Succeed'
            : 'Not Supported')
    }

    for (const instance of instanceList) {
      cy.wrap(setDataPlaneLogLevel).should(
        instance.hasDLLCapability ? 'have.been.calledWith' : 'not.have.been.calledWith',
        instance.id,
        LogLevel.Notice,
      )
    }
  })
})
