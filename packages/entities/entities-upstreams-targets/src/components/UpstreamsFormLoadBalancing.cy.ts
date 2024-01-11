import UpstreamsFormLoadBalancing from './UpstreamsFormLoadBalancing.vue'

describe('<UpstreamsFormLoadBalancing/>', () => {
  it('Component should be rendered correctly', () => {
    cy.mount(UpstreamsFormLoadBalancing, {})

    cy.get('.algorithm-select').should('be.visible')
    cy.getTestId('upstreams-form-slots').should('be.visible')
    cy.get('.hash-on-select').should('be.visible')
    cy.getTestId('upstreams-form-hash-on-header').should('not.exist')
    cy.getTestId('upstreams-form-hash-on-cookie').should('not.exist')
    cy.getTestId('upstreams-form-hash-on-cookie-path').should('not.exist')
    cy.getTestId('upstreams-form-query-argument').should('not.exist')
    cy.getTestId('upstreams-form-uri-capture').should('not.exist')

    cy.get('.hash-fallback-select').should('be.visible')
    cy.getTestId('upstreams-form-hash-fallback-header').should('not.exist')
    cy.getTestId('upstreams-form-hash-fallback-query-argument').should('not.exist')
    cy.getTestId('upstreams-form-hash-fallback-uri-capture').should('not.exist')
  })

  it('Should render header field and bind hashOnHeader data correctly', () => {
    const header: string = 'hash-on-header'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'header',
        'onUpdate:hash-on-header': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-on-select input').should('have.value', 'Header')
    cy.getTestId('upstreams-form-hash-on-header').should('exist')
    cy.getTestId('upstreams-form-hash-on-header').type(header)

    cy.get('@onUpdateSpy').should('have.been.calledWith', header)
  })

  it('Should render cookie and cookie-path fields and bind cookie and cookiePath data correctly', () => {
    const cookie: string = 'hash-on-cookie'
    const cookiePath: string = '/hash-on-cookie-path'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'cookie',
        'onUpdate:hash-on-cookie': cy.spy().as('onUpdateCookieSpy'),
        'onUpdate:hash-on-cookie-path': cy.spy().as('onUpdateCookiePathSpy'),
      },
    })

    cy.get('.hash-on-select input').should('have.value', 'Cookie')

    cy.get('.hash-fallback-select input').should('have.attr', 'disabled')

    cy.getTestId('upstreams-form-hash-on-cookie').should('exist')
    cy.getTestId('upstreams-form-hash-on-cookie').type(cookie)
    cy.get('@onUpdateCookieSpy').should('have.been.calledWith', cookie)

    cy.getTestId('upstreams-form-hash-on-cookie-path').should('exist')
    cy.getTestId('upstreams-form-hash-on-cookie-path').clear()
    cy.getTestId('upstreams-form-hash-on-cookie-path').type(cookiePath)

    cy.get('@onUpdateCookiePathSpy').should('have.been.calledWith', cookiePath)
  })

  it('Should render hashOnQueryArgument field and bind hashOnQueryArgument data correctly', () => {
    const data: string = 'upstreams-form-query-argument'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'query_arg',
        'onUpdate:hash-on-query-argument': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-on-select input').should('have.value', 'Query Argument')
    cy.getTestId('upstreams-form-query-argument').should('exist')
    cy.getTestId('upstreams-form-query-argument').type(data)

    cy.get('@onUpdateSpy').should('have.been.calledWith', data)
  })

  it('Should render hashOnQueryArgument field and bind hashOnQueryArgument data correctly', () => {
    const data: string = 'upstreams-form-uri-capture'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'uri_capture',
        'onUpdate:hash-on-uri-capture': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-on-select input').should('have.value', 'URI Capture')
    cy.getTestId('upstreams-form-uri-capture').should('exist')
    cy.getTestId('upstreams-form-uri-capture').type(data)

    cy.get('@onUpdateSpy').should('have.been.calledWith', data)
  })

  it('Should render hashFallbackHeader field and bind hashFallbackHeader data correctly', () => {
    const data: string = 'hash-fallback-header'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashFallback: 'header',
        'onUpdate:hash-fallback-header': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-fallback-select input').should('have.value', 'Header')
    cy.getTestId('upstreams-form-hash-fallback-header').should('exist')
    cy.getTestId('upstreams-form-hash-fallback-header').type(data)

    cy.get('@onUpdateSpy').should('have.been.calledWith', data)
  })

  it('Should render hashFallbackQueryArgument field and bind hashFallbackQueryArgument data correctly', () => {
    const data: string = 'hash-fallback-query-argument'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashFallback: 'query_arg',
        'onUpdate:hash-fallback-query-argument': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-fallback-select input').should('have.value', 'Query Argument')
    cy.getTestId('upstreams-form-hash-fallback-query-argument').should('exist')
    cy.getTestId('upstreams-form-hash-fallback-query-argument').type(data)

    cy.get('@onUpdateSpy').should('have.been.calledWith', data)
  })

  it('Should render hashFallbackUriCapture field and bind hashFallbackUriCapture data correctly', () => {
    const data: string = 'hash-fallback-query-argument'

    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashFallback: 'uri_capture',
        'onUpdate:hash-fallback-uri-capture': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-fallback-select input').should('have.value', 'URI Capture')
    cy.getTestId('upstreams-form-hash-fallback-uri-capture').should('exist')
    cy.getTestId('upstreams-form-hash-fallback-uri-capture').type(data)

    cy.get('@onUpdateSpy').should('have.been.calledWith', data)
  })

  it('Should bind algorithm data correctly', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        'onUpdate:algorithm': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.algorithm-select').click()
    cy.get('.algorithm-select .select-items-container .select-item').should('have.length', 4)
    cy.get('.algorithm-select .select-items-container [data-testid="select-item-least-connections"]').click()

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'least-connections')
  })

  it('Should bind slots data correctly', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        'onUpdate:slots': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.getTestId('upstreams-form-slots').type('20000')

    cy.get('@onUpdateSpy').should('have.been.calledWith', '20000')
  })

  it('Should bind hashOn data correctly', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'none',
        'onUpdate:hash-on': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-on-select').click()
    cy.get('.hash-on-select .select-items-container [data-testid="select-item-header"]').click()

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'header')
  })

  it('Should clear data on hashOn updates', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashOn: 'none',
        'onUpdate:hash-on-header': cy.spy().as('onUpdateHeaderSpy'),
        'onUpdate:hash-on-cookie': cy.spy().as('onUpdateCookieSpy'),
        'onUpdate:hash-on-cookie-path': cy.spy().as('onUpdateCookiePathSpy'),
        'onUpdate:hash-on-query-argument': cy.spy().as('onUpdateQueryArgumentSpy'),
        'onUpdate:hash-on-uri-capture': cy.spy().as('onUpdateUriCaptureSpy'),
        'onUpdate:hash-fallback': cy.spy().as('onUpdateHashFallbackSpy'),
        'onUpdate:hash-fallback-header': cy.spy().as('onUpdateHashFallbackHeaderSpy'),
        'onUpdate:hash-fallback-query-argument': cy.spy().as('onUpdateHashFallbackQuerySpy'),
        'onUpdate:hash-fallback-uri-capture': cy.spy().as('onUpdateHashFallbackUriSpy'),
      },
    }).then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('@vueWrapper').then(async (wrapper: any) => {
      await wrapper.setProps({ hashOn: 'header' })
      await wrapper.setProps({ hashOn: 'cookie' })
      cy.get('@onUpdateHeaderSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateHashFallbackSpy').should('have.been.calledWith', 'none')
      cy.get('@onUpdateHashFallbackHeaderSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateHashFallbackQuerySpy').should('have.been.calledWith', '')
      cy.get('@onUpdateHashFallbackUriSpy').should('have.been.calledWith', '')

      await wrapper.setProps({ hashOn: 'query_arg' })
      cy.get('@onUpdateCookieSpy').should('have.been.calledWith', '')
      cy.get('@onUpdateCookiePathSpy').should('have.been.calledWith', '/')

      await wrapper.setProps({ hashOn: 'uri_capture' })
      cy.get('@onUpdateQueryArgumentSpy').should('have.been.calledWith', '')

      await wrapper.setProps({ hashOn: 'none' })
      cy.get('@onUpdateUriCaptureSpy').should('have.been.calledWith', '')
    })
  })

  it('Should bind hashFallback data correctly', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashFallback: 'none',
        'onUpdate:hash-fallback': cy.spy().as('onUpdateSpy'),
      },
    })

    cy.get('.hash-fallback-select').click()
    cy.get('.hash-fallback-select .select-items-container [data-testid="select-item-header"]').click()

    cy.get('@onUpdateSpy').should('have.been.calledWith', 'header')
  })

  it('Should clear data on hashFallback updates', () => {
    cy.mount(UpstreamsFormLoadBalancing, {
      props: {
        hashFallback: 'none',
        'onUpdate:hash-fallback-header': cy.spy().as('onUpdateHashFallbackHeaderSpy'),
        'onUpdate:hash-fallback-query-argument': cy.spy().as('onUpdateHashFallbackQuerySpy'),
        'onUpdate:hash-fallback-uri-capture': cy.spy().as('onUpdateHashFallbackUriSpy'),
      },
    }).then(({ wrapper }) => wrapper)
      .as('vueWrapper')

    cy.get('@vueWrapper').then(async (wrapper: any) => {
      await wrapper.setProps({ hashFallback: 'header' })
      await wrapper.setProps({ hashFallback: 'query_arg' })
      cy.get('@onUpdateHashFallbackHeaderSpy').should('have.been.calledWith', '')

      await wrapper.setProps({ hashFallback: 'uri_capture' })
      cy.get('@onUpdateHashFallbackQuerySpy').should('have.been.calledWith', '')

      await wrapper.setProps({ hashFallback: 'none' })
      cy.get('@onUpdateHashFallbackUriSpy').should('have.been.calledWith', '')
    })
  })
})
