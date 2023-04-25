@kong-ui-public/analytics-utilities

# @kong-ui-public/analytics-utilities

## Table of contents

### Enumerations

- [GranularityKeys](enums/GranularityKeys.md)
- [TimeframeKeys](enums/TimeframeKeys.md)

### Classes

- [DeltaQueryTime](classes/DeltaQueryTime.md)
- [Timeframe](classes/Timeframe.md)
- [TimeseriesQueryTime](classes/TimeseriesQueryTime.md)
- [UnaryQueryTime](classes/UnaryQueryTime.md)

### Interfaces

- [AnalyticsExploreMeta](interfaces/AnalyticsExploreMeta.md)
- [AnalyticsExploreRecord](interfaces/AnalyticsExploreRecord.md)
- [AnalyticsExploreResult](interfaces/AnalyticsExploreResult.md)
- [DatePickerSelection](interfaces/DatePickerSelection.md)
- [DimensionMap](interfaces/DimensionMap.md)
- [DruidGranularity](interfaces/DruidGranularity.md)
- [GranularityFullObj](interfaces/GranularityFullObj.md)
- [MetricUnit](interfaces/MetricUnit.md)
- [QueryTime](interfaces/QueryTime.md)
- [RecordEvent](interfaces/RecordEvent.md)
- [TimePeriod](interfaces/TimePeriod.md)
- [TimeframeOptions](interfaces/TimeframeOptions.md)

### Variables

- [Granularities](analytics-utils.md#granularities)
- [TimePeriods](analytics-utils.md#timeperiods)

### Functions

- [ceilToNearestTimeGrain](analytics-utils.md#ceiltonearesttimegrain)
- [datePickerSelectionToTimeframe](analytics-utils.md#datepickerselectiontotimeframe)
- [dstOffsetHours](analytics-utils.md#dstoffsethours)
- [floorToNearestTimeGrain](analytics-utils.md#floortonearesttimegrain)
- [granularitiesToOptions](analytics-utils.md#granularitiestooptions)
- [granularityMsToQuery](analytics-utils.md#granularitymstoquery)
- [msToGranularity](analytics-utils.md#mstogranularity)
- [timeframeToDatepickerSelection](analytics-utils.md#timeframetodatepickerselection)
- [timeframeToDatepickerTimeperiod](analytics-utils.md#timeframetodatepickertimeperiod)

## Variables

### Granularities

• `Const` **Granularities**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Daily` | `number` |
| `Hourly` | `number` |
| `Minutely` | `number` |
| `Weekly` | `number` |

#### Defined in

[granularity.ts:4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L4)

___

### TimePeriods

• `Const` **TimePeriods**: `Map`<`string`, [`Timeframe`](classes/Timeframe.md)\>

#### Defined in

[timeframes.ts:173](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L173)

## Functions

### ceilToNearestTimeGrain

▸ **ceilToNearestTimeGrain**(`date`, `granularity`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |
| `granularity` | [`GranularityKeys`](enums/GranularityKeys.md) |

#### Returns

`Date`

#### Defined in

[granularity.ts:68](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L68)

___

### datePickerSelectionToTimeframe

▸ **datePickerSelectionToTimeframe**(`datePickerSelection`): [`Timeframe`](classes/Timeframe.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `datePickerSelection` | [`DatePickerSelection`](interfaces/DatePickerSelection.md) |

#### Returns

[`Timeframe`](classes/Timeframe.md)

#### Defined in

[timeframes.ts:345](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L345)

___

### dstOffsetHours

▸ **dstOffsetHours**(`d1`, `d2`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `d1` | `Date` |
| `d2` | `Date` |

#### Returns

`number`

#### Defined in

[timeframes.ts:395](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L395)

___

### floorToNearestTimeGrain

▸ **floorToNearestTimeGrain**(`date`, `granularity`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |
| `granularity` | [`GranularityKeys`](enums/GranularityKeys.md) |

#### Returns

`Date`

#### Defined in

[granularity.ts:64](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L64)

___

### granularitiesToOptions

▸ **granularitiesToOptions**(`values`, `i18n`): { `label`: `string` ; `value`: [`GranularityKeys`](enums/GranularityKeys.md) = v }[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `values` | [`GranularityKeys`](enums/GranularityKeys.md)[] |
| `i18n` | `Object` |
| `i18n.t` | (`v`: `string`) => `string` |

#### Returns

{ `label`: `string` ; `value`: [`GranularityKeys`](enums/GranularityKeys.md) = v }[]

#### Defined in

[granularity.ts:11](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L11)

___

### granularityMsToQuery

▸ **granularityMsToQuery**(`granularity`, `origin?`): [`DruidGranularity`](interfaces/DruidGranularity.md) \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `granularity` | ``null`` \| `number` |
| `origin?` | `string` |

#### Returns

[`DruidGranularity`](interfaces/DruidGranularity.md) \| ``null``

#### Defined in

[granularity.ts:21](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L21)

___

### msToGranularity

▸ **msToGranularity**(`ms?`): [`GranularityKeys`](enums/GranularityKeys.md) \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `ms?` | `number` |

#### Returns

[`GranularityKeys`](enums/GranularityKeys.md) \| ``null``

#### Defined in

[granularity.ts:36](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L36)

___

### timeframeToDatepickerSelection

▸ **timeframeToDatepickerSelection**(`timeframe`): [`DatePickerSelection`](interfaces/DatePickerSelection.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](classes/Timeframe.md) |

#### Returns

[`DatePickerSelection`](interfaces/DatePickerSelection.md)

#### Defined in

[timeframes.ts:373](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L373)

___

### timeframeToDatepickerTimeperiod

▸ **timeframeToDatepickerTimeperiod**(`timeframe`): [`TimePeriod`](interfaces/TimePeriod.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](classes/Timeframe.md) |

#### Returns

[`TimePeriod`](interfaces/TimePeriod.md)

#### Defined in

[timeframes.ts:383](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L383)
