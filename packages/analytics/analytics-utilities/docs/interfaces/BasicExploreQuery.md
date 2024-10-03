[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / BasicExploreQuery

# Interface: BasicExploreQuery

## Properties

### descending?

> `optional` **descending**: `boolean`

#### Defined in

[types/explore/basic.ts:45](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L45)

***

### dimensions?

> `optional` **dimensions**: (`"time"` \| `"api_product"` \| `"api_product_version"` \| `"control_plane"` \| `"control_plane_group"` \| `"data_plane_node"` \| `"gateway_service"` \| `"route"` \| `"status_code"` \| `"status_code_grouped"`)[]

#### Defined in

[types/explore/basic.ts:40](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L40)

***

### filters?

> `optional` **filters**: [`BasicExploreFilter`](BasicExploreFilter.md)[]

#### Defined in

[types/explore/basic.ts:41](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L41)

***

### granularity?

> `optional` **granularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Defined in

[types/explore/basic.ts:42](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L42)

***

### limit?

> `optional` **limit**: `number`

#### Defined in

[types/explore/basic.ts:44](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L44)

***

### meta?

> `optional` **meta**: `object`

#### query\_id

> **query\_id**: `string`

#### Defined in

[types/explore/basic.ts:47](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L47)

***

### metrics?

> `optional` **metrics**: (`"active_services"` \| `"request_count"` \| `"request_per_minute"` \| `"response_latency_average"`)[]

#### Defined in

[types/explore/basic.ts:39](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L39)

***

### short\_name?

> `optional` **short\_name**: `boolean`

#### Defined in

[types/explore/basic.ts:46](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L46)

***

### time\_range?

> `optional` **time\_range**: [`TimeRangeV4`](../type-aliases/TimeRangeV4.md)

#### Defined in

[types/explore/basic.ts:43](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/basic.ts#L43)
