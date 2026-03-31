import { describe, expect, it } from 'vitest'
import type { AddOnRecord } from '../types/cloud-gateways-add-on'
import { addOnApiResponseToDisplayRecord } from './managed-cache-add-on-display'
import { pickManagedAddOnCardRecord } from './managed-add-on-config-schema'

describe('konnect-managed cache add-on config', () => {
  it('show a cache config record small and card-ready', () => {
    const payload: AddOnRecord = {
      id: 'add-on-1',
      name: 'my-cache',
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
      id: 'add-on-1',
      name: 'my-cache',
      kind: 'managed-cache.v0',
      capacity_config: { kind: 'tiered', tier: 'small' },
      cache_state_metadata: { provisioning_state: 'ready' },
      cloud_authentication: {
        auth_provider: 'aws',
        aws_region: 'us-east-1',
      },
    })
  })
})
