[@kong-ui-public/analytics-utilities](../analytics-utils.md) / BaseExploreMeta

# Interface: BaseExploreMeta

## Hierarchy

- **`BaseExploreMeta`**

  ↳ [`AnalyticsExploreMeta`](AnalyticsExploreMeta.md)

  ↳ [`AnalyticsExploreV2Meta`](AnalyticsExploreV2Meta.md)

## Table of contents

### Properties

- [dimensions](BaseExploreMeta.md#dimensions)
- [granularity](BaseExploreMeta.md#granularity)
- [limit](BaseExploreMeta.md#limit)
- [metricNames](BaseExploreMeta.md#metricnames)
- [metricUnits](BaseExploreMeta.md#metricunits)
- [queryId](BaseExploreMeta.md#queryid)
- [truncated](BaseExploreMeta.md#truncated)

## Properties

### dimensions

• `Optional` **dimensions**: [`DimensionMap`](DimensionMap.md)

Map of dimension names
Example - { Service: ['service1', 'service2', ... ] }

#### Defined in

[types/analytics-data.ts:39](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L39)

___

### granularity

• `Optional` **granularity**: `number` \| [`GranularityFullObj`](GranularityFullObj.md)

Granularity of this dataset in milliseconds

#### Defined in

[types/analytics-data.ts:52](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L52)

___

### limit

• `Optional` **limit**: `number`

Limit applied to the original query

#### Defined in

[types/analytics-data.ts:60](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L60)

___

### metricNames

• `Optional` **metricNames**: `string`[]

List of metrics in this result

#### Defined in

[types/analytics-data.ts:43](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L43)

___

### metricUnits

• `Optional` **metricUnits**: [`MetricUnit`](MetricUnit.md)

Mapping of metric names to metric units
Example - { TotalRequests: 'count', Latency: 'ms' }

#### Defined in

[types/analytics-data.ts:48](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L48)

___

### queryId

• **queryId**: `string`

Optional query id to be used to trace the original query from which this data resulted

#### Defined in

[types/analytics-data.ts:34](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L34)

___

### truncated

• `Optional` **truncated**: `boolean`

True if results are truncated

#### Defined in

[types/analytics-data.ts:56](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L56)
