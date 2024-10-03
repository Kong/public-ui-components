[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / AiExploreFilter

# Interface: AiExploreFilter

## Extends

- `Omit`\<[`BasicExploreFilter`](BasicExploreFilter.md), `"dimension"`\>

## Properties

### dimension

> **dimension**: `"time"` \| `"control_plane"` \| `"control_plane_group"` \| `"gateway_service"` \| `"route"` \| `"application"` \| `"consumer"` \| `"ai_provider"` \| `"ai_response_model"` \| `"ai_request_model"` \| `"llm_cache_status"` \| `"llm_embeddings_provider"` \| `"llm_embeddings_model"`

#### Defined in

[types/explore/ai.ts:27](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/ai.ts#L27)

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
