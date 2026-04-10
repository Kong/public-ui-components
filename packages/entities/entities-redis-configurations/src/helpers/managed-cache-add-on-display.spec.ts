import { describe, expect, it } from 'vitest'
import type { AddOnRecord } from '../types/cloud-gateways-add-on'
import { addOnApiResponseToDisplayRecord } from './managed-cache-add-on-display'
import { pickManagedAddOnCardRecord } from './managed-add-on-config-schema'

describe('addOnApiResponseToDisplayRecord', () => {
  it('maps API row to card fields', () => {
    const payload: AddOnRecord = {
      id: 'addon-1',
      name: 'cache-1',
      config: {
        kind: 'managed-cache.v0',
        capacity_config: {
          kind: 'tiered',
          tier: 'small',
        },
        state_metadata: {
          provisioning_state: 'ready',
          cloud_authentication: {
            auth_provider: 'aws',
            aws_region: 'us-east-1',
          },
        },
      },
    }

    const displayRecord = addOnApiResponseToDisplayRecord(payload, { cloudAuthAvailable: true })
    const cardRecord = pickManagedAddOnCardRecord(displayRecord)

    expect(cardRecord).toMatchObject({
      id: 'addon-1',
      name: 'cache-1',
      kind: 'managed-cache.v0',
      capacity_config: { kind: 'tiered', tier: 'small' },
      cache_state_metadata: { provisioning_state: 'ready' },
      cloud_authentication: {
        auth_provider: 'aws',
        aws_region: 'us-east-1',
      },
    })
  })

  it('passes cloud auth through when cloudAuthAvailable is false', () => {
    const payload: AddOnRecord = {
      id: 'addon-2',
      config: {
        kind: 'managed-cache.v0',
        state_metadata: {
          cloud_authentication: {
            auth_provider: 'aws',
            aws_region: 'us-west-2',
            aws_secret_access_key: 'secret',
          },
        },
      },
    }

    const displayRecord = addOnApiResponseToDisplayRecord(payload, { cloudAuthAvailable: false })
    expect(displayRecord.cloud_authentication).toEqual({
      auth_provider: 'aws',
      aws_region: 'us-west-2',
      aws_secret_access_key: 'secret',
    })
  })
})
