[@kong-ui-public/analytics-utilities](../analytics-utils.md) / AnalyticsExploreMeta

# Interface: AnalyticsExploreMeta

Metadata about the explore result

## Table of contents

### Properties

- [dimensions](AnalyticsExploreMeta.md#dimensions)
- [end](AnalyticsExploreMeta.md#end)
- [granularity](AnalyticsExploreMeta.md#granularity)
- [limit](AnalyticsExploreMeta.md#limit)
- [metricNames](AnalyticsExploreMeta.md#metricnames)
- [metricUnits](AnalyticsExploreMeta.md#metricunits)
- [queryId](AnalyticsExploreMeta.md#queryid)
- [start](AnalyticsExploreMeta.md#start)
- [truncated](AnalyticsExploreMeta.md#truncated)

## Properties

### dimensions

• `Optional` **dimensions**: [`DimensionMap`](DimensionMap.md)

Map of dimension names
Example - { Service: ['service1', 'service2', ... ] }

#### Defined in

[types/analytics-data.ts:50](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L50)

___

### end

• **end**: `number`

Millisecond timestamp representing the end of this dataset

#### Defined in

[types/analytics-data.ts:41](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L41)

___

### granularity

• `Optional` **granularity**: `number` \| [`GranularityFullObj`](GranularityFullObj.md)

Granularity of this dataset in milliseconds

#### Defined in

[types/analytics-data.ts:63](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L63)

___

### limit

• `Optional` **limit**: `number`

Limit applied to the original query

#### Defined in

[types/analytics-data.ts:71](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L71)

___

### metricNames

• `Optional` **metricNames**: `string`[]

List of metrics in this result

#### Defined in

[types/analytics-data.ts:54](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L54)

___

### metricUnits

• `Optional` **metricUnits**: [`MetricUnit`](MetricUnit.md)

Mapping of metric names to metric units
Example - { TotalRequests: 'count', Latency: 'ms' }

#### Defined in

[types/analytics-data.ts:59](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L59)

___

### queryId

• **queryId**: `string`

Optional query id to be used to trace the original query from which this data resulted

#### Defined in

[types/analytics-data.ts:45](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L45)

___

### start

• **start**: `number`

Millisecond timestamp representing the start of this dataset

#### Defined in

[types/analytics-data.ts:37](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L37)

___

### truncated

• `Optional` **truncated**: `boolean`

True if results are truncated

#### Defined in

[types/analytics-data.ts:67](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L67)
