import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import useWindow from './index'

const locationMock = {
  hostname: 'konghq.com',
  href: 'https://konghq.com/api/path',
  origin: 'https://konghq.com',
  pathname: '/api/path',
  search: '?testing=true',
}

describe('useWindow', () => {
  beforeEach(() => {
    const windowSpy = vi.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(() => ({
      // Ignore missing properties
      // @ts-ignore
      location: locationMock,
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('getLocationHostname() returns the correct value', () => {
    const win = useWindow()
    expect(win.getLocationHostname()).toEqual(locationMock.hostname)
  })

  it('getLocationHref() returns the correct value', () => {
    const win = useWindow()
    expect(win.getLocationHref()).toEqual(locationMock.href)
  })

  it('getLocationOrigin() returns the correct value', () => {
    const win = useWindow()
    expect(win.getLocationOrigin()).toEqual(locationMock.origin)
  })

  it('getLocationPathname() returns the correct value', () => {
    const win = useWindow()
    expect(win.getLocationPathname()).toEqual(locationMock.pathname)
  })

  it('getLocationSearch() returns the correct value', () => {
    const win = useWindow()
    expect(win.getLocationSearch()).toEqual(locationMock.search)
  })
})
