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
- [AnalyticsExploreV2Meta](interfaces/AnalyticsExploreV2Meta.md)
- [AnalyticsExploreV2Result](interfaces/AnalyticsExploreV2Result.md)
- [AnalyticsExploreV3Meta](interfaces/AnalyticsExploreV3Meta.md)
- [AnalyticsExploreV3Result](interfaces/AnalyticsExploreV3Result.md)
- [BaseExploreMeta](interfaces/BaseExploreMeta.md)
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
- [formatISOTimeWithTZ](analytics-utils.md#formatisotimewithtz)
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

[granularity.ts:6](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L6)

___

### TimePeriods

• `Const` **TimePeriods**: `Map`<`string`, [`Timeframe`](classes/Timeframe.md)\>

#### Defined in

[timeframes.ts:227](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L227)

## Functions

### ceilToNearestTimeGrain

▸ **ceilToNearestTimeGrain**(`date`, `granularity`, `tz?`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |
| `granularity` | [`GranularityKeys`](enums/GranularityKeys.md) |
| `tz?` | `string` |

#### Returns

`Date`

#### Defined in

[granularity.ts:78](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L78)

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

[timeframes.ts:399](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L399)

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

[timeframes.ts:449](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L449)

___

### floorToNearestTimeGrain

▸ **floorToNearestTimeGrain**(`date`, `granularity`, `tz?`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |
| `granularity` | [`GranularityKeys`](enums/GranularityKeys.md) |
| `tz?` | `string` |

#### Returns

`Date`

#### Defined in

[granularity.ts:74](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L74)

___

### formatISOTimeWithTZ

▸ **formatISOTimeWithTZ**(`ts`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ts` | `number` \| `Date` |

#### Returns

`string`

#### Defined in

[format.ts:3](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/format.ts#L3)

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

[granularity.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L13)

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

[granularity.ts:23](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L23)

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

[granularity.ts:38](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/granularity.ts#L38)

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

[timeframes.ts:427](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L427)

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

[timeframes.ts:437](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L437)
