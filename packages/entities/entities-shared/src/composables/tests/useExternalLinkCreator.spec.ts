import { expect } from 'vitest'
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
  })
})
