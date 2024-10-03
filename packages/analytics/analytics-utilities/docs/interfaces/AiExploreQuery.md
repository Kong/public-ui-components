[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / AiExploreQuery

# Interface: AiExploreQuery

## Extends

- `Omit`\<[`BasicExploreQuery`](BasicExploreQuery.md), `"metrics"` \| `"dimensions"` \| `"filters"`\>

## Properties

### descending?

> `optional` **descending**: `boolean`

#### Inherited from

`Omit.descending`

#### Defined in

[types/explore/basic.ts:45](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L45)

***

### dimensions?

> `optional` **dimensions**: (`"time"` \| `"control_plane"` \| `"control_plane_group"` \| `"gateway_service"` \| `"route"` \| `"application"` \| `"consumer"` \| `"ai_provider"` \| `"ai_response_model"` \| `"ai_request_model"` \| `"llm_cache_status"` \| `"llm_embeddings_provider"` \| `"llm_embeddings_model"`)[]

#### Defined in

[types/explore/ai.ts:47](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/ai.ts#L47)

***

### filters?

> `optional` **filters**: [`AiExploreFilter`](AiExploreFilter.md)[]

#### Defined in

[types/explore/ai.ts:48](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/ai.ts#L48)

***

### granularity?

> `optional` **granularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Inherited from

`Omit.granularity`

#### Defined in

[types/explore/basic.ts:42](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L42)

***

### limit?

> `optional` **limit**: `number`

#### Inherited from

`Omit.limit`

#### Defined in

[types/explore/basic.ts:44](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L44)

***

### meta?

> `optional` **meta**: `object`

#### query\_id

> **query\_id**: `string`

#### Inherited from

`Omit.meta`

#### Defined in

[types/explore/basic.ts:47](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L47)

***

### metrics?

> `optional` **metrics**: (`"total_tokens"` \| `"prompt_tokens"` \| `"completion_tokens"` \| `"ai_request_count"` \| `"cost"` \| `"llm_cache_embeddings_latency_average"` \| `"llm_cache_fetch_latency_average"` \| `"llm_latency_average"` \| `"llm_embeddings_tokens"` \| `"llm_embeddings_cost"`)[]

#### Defined in

[types/explore/ai.ts:46](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/ai.ts#L46)

***

### short\_name?

> `optional` **short\_name**: `boolean`

#### Inherited from

`Omit.short_name`

#### Defined in

[types/explore/basic.ts:46](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L46)

***

### time\_range?

> `optional` **time\_range**: [`TimeRangeV4`](../type-aliases/TimeRangeV4.md)

#### Inherited from

`Omit.time_range`

#### Defined in

[types/explore/basic.ts:43](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L43)
