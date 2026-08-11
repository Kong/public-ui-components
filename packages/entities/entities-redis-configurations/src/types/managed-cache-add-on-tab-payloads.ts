export type TerraformControlPlaneOwner = {
  control_plane: {
    control_plane_id: string | null
    control_plane_geo: string | null
  }
}

export type TerraformControlPlaneGroupOwner = {
  control_plane_group: {
    control_plane_group_id: string | null
    control_plane_group_geo: string | null
  }
}

export type TerraformOwner = TerraformControlPlaneOwner | TerraformControlPlaneGroupOwner

export type TerraformManagedCache = {
  capacity_config?: {
    tiered: {
      tier: string
    }
  }
}

export type AddOnTfArgs = {
  name: string | null
  owner: TerraformOwner | null
  config: {
    managed_cache: TerraformManagedCache
  }
}
