[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / ExploreFilter

# Interface: ExploreFilter

## Extends

- `Omit`\<[`BasicExploreFilter`](BasicExploreFilter.md), `"dimension"`\>

## Properties

### dimension

> **dimension**: `"api_product"` \| `"api_product_version"` \| `"control_plane"` \| `"control_plane_group"` \| `"data_plane_node"` \| `"gateway_service"` \| `"route"` \| `"status_code"` \| `"status_code_grouped"` \| `"application"` \| `"consumer"` \| `"iso_code"`

#### Defined in

[types/explore/advanced.ts:19](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/advanced.ts#L19)

***

### type

> **type**: `"in"` \| `"not_in"` \| `"selector"`

#### Inherited from

`Omit.type`

#### Defined in

[types/explore/basic.ts:24](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L24)

***

### values

> **values**: (`null` \| `string` \| `number`)[]

#### Inherited from

`Omit.values`

#### Defined in

[types/explore/basic.ts:26](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L26)
