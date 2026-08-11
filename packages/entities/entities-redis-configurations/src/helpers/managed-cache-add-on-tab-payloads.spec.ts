import { describe, expect, it } from 'vitest'

import { addOnToTerraformArgs, cloneAddOnResponseForConfigTabs } from './managed-cache-add-on-tab-payloads'

describe('cloneAddOnResponseForConfigTabs', () => {
  it('creates an independent copy so edits do not affect the original response', () => {
    const sourceAddOnResponse = {
      id: 'addon-eu-orders-cache',
      name: 'orders-cache-eu',
      owner: {
        kind: 'control-plane',
        control_plane_id: 'cp-orders-eu',
        control_plane_geo: 'eu',
      },
      config: {
        kind: 'managed-cache.v0',
        capacity_config: {
          kind: 'tiered',
          tier: '3',
        },
      },
    }

    const clonedAddOnResponse = cloneAddOnResponseForConfigTabs(sourceAddOnResponse)
    clonedAddOnResponse.config.capacity_config!.tier = '9'

    expect(clonedAddOnResponse).not.toBe(sourceAddOnResponse)
    expect(clonedAddOnResponse.config).not.toBe(sourceAddOnResponse.config)
    expect(sourceAddOnResponse.config.capacity_config!.tier).toBe('3')
  })
})

describe('addOnToTerraformArgs', () => {
  it('converts a cp add-on into the TR argument shape', () => {
    const terraformArgs = addOnToTerraformArgs({
      id: 'addon-us-checkout-cache',
      name: 'checkout-cache-us',
      owner: {
        kind: 'control-plane',
        control_plane_id: 'cp-checkout-us',
        control_plane_geo: 'us',
      },
      config: {
        kind: 'managed-cache.v0',
        capacity_config: {
          kind: 'tiered',
          tier: '3',
        },
      },
    })

    expect(terraformArgs).toEqual({
      name: 'checkout-cache-us',
      owner: {
        control_plane: {
          control_plane_id: 'cp-checkout-us',
          control_plane_geo: 'us',
        },
      },
      config: {
        managed_cache: {
          capacity_config: {
            tiered: { tier: '3' },
          },
        },
      },
    })
  })

  it('omits incomplete values so TR receives a safe minimal payload', () => {
    const terraformArgs = addOnToTerraformArgs({
      id: 'addon-apac-billing-cache',
      config: {
        kind: 'managed-cache.v0',
        capacity_config: {
          kind: 'tiered',
          tier: '',
        },
      },
    })

    expect(terraformArgs).toEqual({
      name: null,
      owner: null,
      config: {
        managed_cache: {},
      },
    })
  })
})
