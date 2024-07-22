[@kong-ui-public/analytics-utilities](../analytics-utils.md) / AnalyticsExploreV3Meta

# Interface: AnalyticsExploreV3Meta

Metadata about the exploreV3 result

## Hierarchy

- `Omit`<[`AnalyticsExploreV2Meta`](AnalyticsExploreV2Meta.md), ``"dimensions"``\>

  ↳ **`AnalyticsExploreV3Meta`**

## Table of contents

### Properties

- [display](AnalyticsExploreV3Meta.md#display)
- [endMs](AnalyticsExploreV3Meta.md#endms)
- [granularity](AnalyticsExploreV3Meta.md#granularity)
- [limit](AnalyticsExploreV3Meta.md#limit)
- [metricNames](AnalyticsExploreV3Meta.md#metricnames)
- [metricUnits](AnalyticsExploreV3Meta.md#metricunits)
- [queryId](AnalyticsExploreV3Meta.md#queryid)
- [startMs](AnalyticsExploreV3Meta.md#startms)
- [truncated](AnalyticsExploreV3Meta.md#truncated)

## Properties

### display

• **display**: `Record`<`string`, `Record`<`string`, `string`\>\>

#### Defined in

[types/analytics-data.ts:98](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L98)

___

### endMs

• **endMs**: `number`

Millisecond timestamp representing the end of this dataset

#### Inherited from

Omit.endMs

#### Defined in

[types/analytics-data.ts:88](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L88)

___

### granularity

• `Optional` **granularity**: `number` \| [`GranularityFullObj`](GranularityFullObj.md)

Granularity of this dataset in milliseconds

#### Inherited from

Omit.granularity

#### Defined in

[types/analytics-data.ts:52](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L52)

___

### limit

• `Optional` **limit**: `number`

Limit applied to the original query

#### Inherited from

Omit.limit

#### Defined in

[types/analytics-data.ts:60](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L60)

___

### metricNames

• `Optional` **metricNames**: `string`[]

List of metrics in this result

#### Inherited from

Omit.metricNames

#### Defined in

[types/analytics-data.ts:43](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L43)

___

### metricUnits

• `Optional` **metricUnits**: [`MetricUnit`](MetricUnit.md)

Mapping of metric names to metric units
Example - { TotalRequests: 'count', Latency: 'ms' }

#### Inherited from

Omit.metricUnits

#### Defined in

[types/analytics-data.ts:48](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L48)

___

### queryId

• **queryId**: `string`

Optional query id to be used to trace the original query from which this data resulted

#### Inherited from

Omit.queryId

#### Defined in

[types/analytics-data.ts:34](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L34)

___

### startMs

• **startMs**: `number`

Millisecond timestamp representing the start of this dataset

#### Inherited from

Omit.startMs

#### Defined in

[types/analytics-data.ts:84](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L84)

___

### truncated

• `Optional` **truncated**: `boolean`

True if results are truncated

#### Inherited from

Omit.truncated

#### Defined in

[types/analytics-data.ts:56](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L56)
