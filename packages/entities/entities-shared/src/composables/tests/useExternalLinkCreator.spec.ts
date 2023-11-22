import { expect, vi } from 'vitest'
import type { SpyInstance } from 'vitest'
import composables from '..'

const { useExternalLinkCreator } = composables

const record = {
  id: 'e662e086-84b2-11ee-b962-0242ac120002:ece8ecac-84b2-11ee-b962-0242ac120002',
  name: 'record-name',
  label: 'dp-mock-msg-per-sec-us-dev',
  deleted: false,
}

const firstUuid = record?.id.toString().split(':')[0]
const secondUuid = record?.id.toString().split(':')[1]
const host = window.location.origin

const routeParams = [
  'gateway-manager',
  firstUuid,
  'routes',
  secondUuid,
]

describe('parse-route-parameters', () => {
  let consoleMock: SpyInstance

  beforeEach(() => {
    consoleMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('builds valid url with multiple parameters', () => {
    const url = useExternalLinkCreator(routeParams)

    expect(url).toBe(`${host}/gateway-manager/${firstUuid}/routes/${secondUuid}`)
  })

  it('builds with single parameter', () => {
    const url = useExternalLinkCreator([routeParams[0]])

    expect(url).toBe(`${host}/gateway-manager`)
  })

  it('fails if an empty path param is provided', () => {
    const url = useExternalLinkCreator([routeParams[0], '-1', '   '])

    // Console error should be thrown, and method will return empty string
    expect(url).toBe('')
    expect(consoleMock).toHaveBeenCalledOnce()
    expect(consoleMock).toHaveBeenLastCalledWith('Failed to build valid URL:', new Error('Invalid url'))
  })

  it('fails if there are trailing slashes', () => {
    const url = useExternalLinkCreator([routeParams[0], routeParams[1], '//'])

    // Console error should be thrown, and method will return empty string
    expect(url).toBe('')
    expect(consoleMock).toHaveBeenLastCalledWith('Failed to build valid URL:', new Error('Invalid url'))
  })

  it('fails if the base URL uses http protocol', () => {
    vi.spyOn(global as any, 'window', 'get').mockImplementationOnce(() => ({
      location: {
        origin: 'http://cloud.konghq.tech/',
      },
    }))

    const url = useExternalLinkCreator([routeParams[0], routeParams[1]])

    expect(url).toBe('')
    expect(consoleMock).toHaveBeenLastCalledWith('Failed to build valid URL:', new Error('Invalid url'))
  })

  it('allows http only for localhost', () => {
    vi.spyOn(global as any, 'window', 'get').mockImplementationOnce(() => ({
      location: {
        origin: 'http://localhost:3000/',
      },
    }))

    const url = useExternalLinkCreator([routeParams[0], routeParams[1]])

    expect(url).toBe(`http://localhost:3000/${routeParams[0]}/${routeParams[1]}`)
  })

  it('does not allow port number following an external domain', () => {
    vi.spyOn(global as any, 'window', 'get').mockImplementationOnce(() => ({
      location: {
        origin: 'http://cloud.konghq.tech:3000/',
      },
    }))

    const url = useExternalLinkCreator([routeParams[0]])

    expect(url).toBe('')
    expect(consoleMock).toHaveBeenLastCalledWith('Failed to build valid URL:', new Error('Invalid url'))
  })
})
