[@kong-ui-public/analytics-utilities](../analytics-utils.md) / AnalyticsExploreMeta

# Interface: AnalyticsExploreMeta

Metadata about the explore result

## Hierarchy

- [`BaseExploreMeta`](BaseExploreMeta.md)

  ↳ **`AnalyticsExploreMeta`**

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

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[dimensions](BaseExploreMeta.md#dimensions)

#### Defined in

[types/analytics-data.ts:39](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L39)

___

### end

• **end**: `number`

Second timestamp representing the end of this dataset

#### Defined in

[types/analytics-data.ts:74](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L74)

___

### granularity

• `Optional` **granularity**: `number` \| [`GranularityFullObj`](GranularityFullObj.md)

Granularity of this dataset in milliseconds

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[granularity](BaseExploreMeta.md#granularity)

#### Defined in

[types/analytics-data.ts:52](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L52)

___

### limit

• `Optional` **limit**: `number`

Limit applied to the original query

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[limit](BaseExploreMeta.md#limit)

#### Defined in

[types/analytics-data.ts:60](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L60)

___

### metricNames

• `Optional` **metricNames**: `string`[]

List of metrics in this result

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[metricNames](BaseExploreMeta.md#metricnames)

#### Defined in

[types/analytics-data.ts:43](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L43)

___

### metricUnits

• `Optional` **metricUnits**: [`MetricUnit`](MetricUnit.md)

Mapping of metric names to metric units
Example - { TotalRequests: 'count', Latency: 'ms' }

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[metricUnits](BaseExploreMeta.md#metricunits)

#### Defined in

[types/analytics-data.ts:48](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L48)

___

### queryId

• **queryId**: `string`

Optional query id to be used to trace the original query from which this data resulted

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[queryId](BaseExploreMeta.md#queryid)

#### Defined in

[types/analytics-data.ts:34](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L34)

___

### start

• **start**: `number`

Second timestamp representing the start of this dataset

#### Defined in

[types/analytics-data.ts:70](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L70)

___

### truncated

• `Optional` **truncated**: `boolean`

True if results are truncated

#### Inherited from

[BaseExploreMeta](BaseExploreMeta.md).[truncated](BaseExploreMeta.md#truncated)

#### Defined in

[types/analytics-data.ts:56](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L56)
