// Tab payloads for Konnect-managed add-ons: JSON tab = GET body clone; TR tab = `konnect_cloud_gateway_addon` map
import type {
  CloudGatewaysAddOnResponse,
  ControlPlaneAddOnOwner,
  ManagedCacheAddOnConfig,
} from '../types/cloud-gateways-add-on'
import type {
  AddOnTfArgs,
  TerraformManagedCache,
  TerraformOwner,
} from '../types/managed-cache-add-on-tab-payloads'

// Deep clone of GET `/v2/cloud-gateways/add-ons/{id}` for tabs
export function cloneAddOnResponse(addOnResponse: CloudGatewaysAddOnResponse): CloudGatewaysAddOnResponse {
  // Deep-copy nested objects/arrays so edits or JSON.stringify in UI cannot change the in-memory add-on row
  try {
    return structuredClone(addOnResponse)
  } catch {
    return JSON.parse(JSON.stringify(addOnResponse)) as CloudGatewaysAddOnResponse
  }
}

export function cloneAddOnResponseForConfigTabs(addOnResponse: CloudGatewaysAddOnResponse): CloudGatewaysAddOnResponse {
  return cloneAddOnResponse(addOnResponse)
}

function terraformOwnerBlock(owner?: ControlPlaneAddOnOwner): TerraformOwner | null {
  // Owner can be temporarily missing while host data is still resolving
  if (!owner || typeof owner !== 'object') {
    return null
  }

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

function terraformManagedCacheBlock(addOnConfig?: ManagedCacheAddOnConfig): TerraformManagedCache {
  // Keep TR output valid even when config is partially populated
  if (!addOnConfig || typeof addOnConfig !== 'object') {
    return {}
  }

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
export function addOnToTerraformArgs(addOnResponse: CloudGatewaysAddOnResponse): AddOnTfArgs {
  // Return provider-shaped args only; TerraformCodeBlock owns the resource header
  return {
    name: addOnResponse.name ?? null,
    owner: terraformOwnerBlock(addOnResponse.owner),
    config: {
      managed_cache: terraformManagedCacheBlock(addOnResponse.config),
    },
  }
}
