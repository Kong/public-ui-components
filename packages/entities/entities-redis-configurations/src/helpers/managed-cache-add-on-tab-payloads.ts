// Tab payloads for Konnect-managed add-ons: JSON tab = GET body clone; TR tab = `konnect_cloud_gateway_addon` map
import type {
  CloudGatewaysAddOnResponse,
  ControlPlaneAddOnOwner,
  ManagedCacheAddOnConfig,
} from '../types/cloud-gateways-add-on'

// Deep clone of GET `/v2/cloud-gateways/add-ons/{id}` for tabs
export function cloneAddOnResponse(addOnResponse: CloudGatewaysAddOnResponse): CloudGatewaysAddOnResponse {
  // Deep-copy nested objects/arrays so edits or JSON.stringify in UI cannot change the in-memory add-on row
  return structuredClone(addOnResponse)
}

export function cloneAddOnResponseForConfigTabs(addOnResponse: CloudGatewaysAddOnResponse): Record<string, any> {
  return cloneAddOnResponse(addOnResponse) as Record<string, any>
}

function terraformOwnerBlock(owner: ControlPlaneAddOnOwner): Record<string, any> {
  if (owner.kind === 'control-plane') {
    return {
      control_plane: {
        control_plane_id: owner.control_plane_id ?? null,
        control_plane_geo: owner.control_plane_geo ?? null,
      },
    }
  }
  return {
    control_plane_group: {
      control_plane_group_id: owner.control_plane_group_id ?? null,
      control_plane_group_geo: owner.control_plane_group_geo ?? null,
    },
  }
}

function terraformManagedCacheBlock(addOnConfig: ManagedCacheAddOnConfig): Record<string, any> {
  const tieredCapacity = addOnConfig.capacity_config
  if (!tieredCapacity || tieredCapacity.kind !== 'tiered' || tieredCapacity.tier == null || tieredCapacity.tier === '') {
    return {}
  }
  return {
    capacity_config: {
      tiered: { tier: String(tieredCapacity.tier) },
    },
  }
}

// GET add-on body with `konnect_cloud_gateway_addon` argument map
export function addOnToTerraformArgs(addOnResponse: CloudGatewaysAddOnResponse): Record<string, any> {
  return {
    name: addOnResponse.name ?? null,
    owner: terraformOwnerBlock(addOnResponse.owner ?? {}),
    config: {
      managed_cache: terraformManagedCacheBlock(addOnResponse.config),
    },
  }
}
