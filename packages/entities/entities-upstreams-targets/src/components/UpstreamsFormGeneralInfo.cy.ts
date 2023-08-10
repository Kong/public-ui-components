import UpstreamsFormGeneralInfo from './UpstreamsFormGeneralInfo.vue'
import { certificates5, KMConfig, konnectConfig, services5 } from '../../fixtures/mockData'

describe('<UpstreamsFormGeneralInfo />', () => {
  describe('Konnect', () => {
    const interceptFetchServices = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/services*`,
        },
        {
          statusCode: status,
          body: { data: services5 },
        },
      ).as('fetchServices')
    }
    const interceptFetchCertificates = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${konnectConfig.apiBaseUrl}/api/runtime_groups/${konnectConfig.controlPlaneId}/certificates*`,
        },
        {
          statusCode: status,
          body: { data: certificates5 },
        },
      ).as('fetchCertificates')
    }

    it('Component should be rendered correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select').should('be.visible')
      cy.getTestId('upstreams-form-host-header').should('be.visible')
      cy.get('.certificate-select').should('be.visible')
      cy.getTestId('upstreams-form-tags').should('be.visible')
    })

    it('bind Name data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const hostName: string = 'host-1.com'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          name: hostName,
          'onUpdate:name': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select input').should('have.value', hostName)

      cy.get('.name-select').click()

      cy.get('.name-select .k-select-list').should('be.visible')
      cy.get('.name-select .k-select-list .k-select-item').should('have.length', 5)
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', 'host-2.com')
    })

    it('should allow Name creation', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const newHost: string = 'new-host'
      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          name: '',
          'onUpdate:name': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list').should('be.visible')

      cy.getTestId('upstreams-form-name').type(newHost)
      cy.get('.name-select .k-select-list .k-select-new-item').should('have.length', 1)
      cy.get('.name-select .k-select-list .k-select-new-item').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', newHost)
    })

    it('should accept and display created Name', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const createdName: string = 'created-name'
      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          name: createdName,
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select input').should('have.value', createdName)
      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list').should('be.visible')
      cy.get('.name-select .k-select-list .k-select-item').last().should('contain.text', createdName)
    })

    it('bind hostHeader data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const hostHeader: string = 'host-header-1'
      const hostHeader2: string = 'host-header-2'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          hostHeader,
          'onUpdate:host-header': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.getTestId('upstreams-form-host-header').should('have.value', hostHeader)

      cy.getTestId('upstreams-form-host-header').clear()

      cy.getTestId('upstreams-form-host-header').type(hostHeader2)

      cy.get('@onUpdateSpy').should('have.been.calledWith', hostHeader2)
    })

    it('bind clientCertificate data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const clientCertificate: string = '1'
      const clientCertificate2: string = '2'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          clientCertificate,
          'onUpdate:client-certificate': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.certificate-select input').should('have.value', clientCertificate)

      cy.get('.certificate-select').click()

      cy.get('.certificate-select .k-select-list').should('be.visible')
      cy.get('.certificate-select .k-select-list .k-select-item').should('have.length', 5)
      cy.get('.certificate-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', clientCertificate2)
    })

    it('bind tags data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const tags: string = 'tag1, tag2'
      const tags2: string = 'tag3'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: konnectConfig,
          tags,
          'onUpdate:tags': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.getTestId('upstreams-form-tags').should('have.value', tags)

      cy.getTestId('upstreams-form-tags').clear()

      cy.getTestId('upstreams-form-tags').type(tags2)

      cy.get('@onUpdateSpy').should('have.been.calledWith', tags2)
    })
  })

  describe('Kong Manager', () => {
    const interceptFetchServices = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/services*`,
        },
        {
          statusCode: status,
          body: { data: services5 },
        },
      ).as('fetchServices')
    }
    const interceptFetchCertificates = (status = 200): void => {
      cy.intercept(
        {
          method: 'GET',
          url: `${KMConfig.apiBaseUrl}/${KMConfig.workspace}/certificates*`,
        },
        {
          statusCode: status,
          body: { data: certificates5 },
        },
      ).as('fetchCertificates')
    }

    it('Component should be rendered correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select').should('be.visible')
      cy.getTestId('upstreams-form-host-header').should('be.visible')
      cy.get('.certificate-select').should('be.visible')
      cy.getTestId('upstreams-form-tags').should('be.visible')
    })

    it('bind Name data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const hostName: string = 'host-1.com'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          name: hostName,
          'onUpdate:name': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select input').should('have.value', hostName)

      cy.get('.name-select').click()

      cy.get('.name-select .k-select-list').should('be.visible')
      cy.get('.name-select .k-select-list .k-select-item').should('have.length', 5)
      cy.get('.name-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', 'host-2.com')
    })

    it('should allow Name creation', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const newHost: string = 'new-host'
      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          name: '',
          'onUpdate:name': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list').should('be.visible')

      cy.getTestId('upstreams-form-name').type(newHost)
      cy.get('.name-select .k-select-list .k-select-new-item').should('have.length', 1)
      cy.get('.name-select .k-select-list .k-select-new-item').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', newHost)
    })

    it('should accept and display created Name', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const createdName: string = 'created-name'
      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          name: createdName,
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.name-select input').should('have.value', createdName)
      cy.get('.name-select').click()
      cy.get('.name-select .k-select-list').should('be.visible')
      cy.get('.name-select .k-select-list .k-select-item').last().should('contain.text', createdName)
    })

    it('bind hostHeader data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const hostHeader: string = 'host-header-1'
      const hostHeader2: string = 'host-header-2'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          hostHeader,
          'onUpdate:host-header': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.getTestId('upstreams-form-host-header').should('have.value', hostHeader)

      cy.getTestId('upstreams-form-host-header').clear()

      cy.getTestId('upstreams-form-host-header').type(hostHeader2)

      cy.get('@onUpdateSpy').should('have.been.calledWith', hostHeader2)
    })

    it('bind clientCertificate data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const clientCertificate: string = '1'
      const clientCertificate2: string = '2'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          clientCertificate,
          'onUpdate:client-certificate': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.get('.certificate-select input').should('have.value', clientCertificate)

      cy.get('.certificate-select').click()

      cy.get('.certificate-select .k-select-list').should('be.visible')
      cy.get('.certificate-select .k-select-list .k-select-item').should('have.length', 5)
      cy.get('.certificate-select .k-select-list [data-testid="k-select-item-2"]').click()

      cy.get('@onUpdateSpy').should('have.been.calledWith', clientCertificate2)
    })

    it('bind tags data correctly', () => {
      interceptFetchServices()
      interceptFetchCertificates()

      const tags: string = 'tag1, tag2'
      const tags2: string = 'tag3'

      cy.mount(UpstreamsFormGeneralInfo, {
        props: {
          config: KMConfig,
          tags,
          'onUpdate:tags': cy.spy().as('onUpdateSpy'),
        },
      })

      cy.wait('@fetchServices')
      cy.wait('@fetchCertificates')

      cy.getTestId('upstreams-form-tags').should('have.value', tags)

      cy.getTestId('upstreams-form-tags').clear()

      cy.getTestId('upstreams-form-tags').type(tags2)

      cy.get('@onUpdateSpy').should('have.been.calledWith', tags2)
    })
  })
})
