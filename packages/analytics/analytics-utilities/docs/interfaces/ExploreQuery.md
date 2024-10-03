[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / ExploreQuery

# Interface: ExploreQuery

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

> `optional` **dimensions**: (`"time"` \| `"api_product"` \| `"api_product_version"` \| `"control_plane"` \| `"control_plane_group"` \| `"data_plane_node"` \| `"gateway_service"` \| `"route"` \| `"status_code"` \| `"status_code_grouped"` \| `"application"` \| `"consumer"` \| `"iso_code"`)[]

#### Defined in

[types/explore/advanced.ts:49](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/advanced.ts#L49)

***

### filters?

> `optional` **filters**: [`ExploreFilter`](ExploreFilter.md)[]

#### Defined in

[types/explore/advanced.ts:50](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/advanced.ts#L50)

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

> `optional` **metrics**: (`"active_services"` \| `"request_count"` \| `"request_per_minute"` \| `"response_latency_average"` \| `"response_latency_p99"` \| `"response_latency_p95"` \| `"response_latency_p50"` \| `"upstream_latency_p99"` \| `"upstream_latency_p95"` \| `"upstream_latency_p50"` \| `"upstream_latency_average"` \| `"kong_latency_p99"` \| `"kong_latency_p95"` \| `"kong_latency_p50"` \| `"kong_latency_average"` \| `"response_size_p99"` \| `"response_size_p95"` \| `"response_size_p50"` \| `"request_size_p99"` \| `"request_size_p95"` \| `"request_size_p50"` \| `"request_size_average"` \| `"response_size_average"`)[]

#### Defined in

[types/explore/advanced.ts:48](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/advanced.ts#L48)

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
