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
  it('builds valid url', () => {
    const url = useExternalLinkCreator(routeParams)

    expect(url).toBe(`${host}/gateway-manager/${firstUuid}/routes/${secondUuid}`)
  })

  it('fails if provided string is invalid', () => {
    const url = useExternalLinkCreator([routeParams[0], ''])

    expect(url).toBe(`${host}/gateway-manager/`)
  })
})
