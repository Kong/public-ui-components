@kong/analytics-time-utils

# @kong/analytics-time-utils

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

- [DatePickerSelection](interfaces/DatePickerSelection.md)
- [DruidGranularity](interfaces/DruidGranularity.md)
- [QueryTime](interfaces/QueryTime.md)
- [TimePeriod](interfaces/TimePeriod.md)
- [TimeframeOptions](interfaces/TimeframeOptions.md)

### Variables

- [Granularities](API.md#granularities)
- [TimePeriods](API.md#timeperiods)

### Functions

- [ceilToNearestTimeGrain](API.md#ceiltonearesttimegrain)
- [datePickerSelectionToTimeframe](API.md#datepickerselectiontotimeframe)
- [dstOffsetHours](API.md#dstoffsethours)
- [floorToNearestTimeGrain](API.md#floortonearesttimegrain)
- [granularitiesToOptions](API.md#granularitiestooptions)
- [granularityMsToQuery](API.md#granularitymstoquery)
- [msToGranularity](API.md#mstogranularity)
- [timeframeToDatepickerSelection](API.md#timeframetodatepickerselection)
- [timeframeToDatepickerTimeperiod](API.md#timeframetodatepickertimeperiod)

## Variables

### Granularities

• `Const` **Granularities**: { [key in GranularityKeys]: number }

#### Defined in

[granularity.ts:4](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L4)

___

### TimePeriods

• `Const` **TimePeriods**: `Map`<`string`, [`Timeframe`](classes/Timeframe.md)\>

#### Defined in

[timeframes.ts:173](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/timeframes.ts#L173)

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

[granularity.ts:68](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L68)

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

[timeframes.ts:346](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/timeframes.ts#L346)

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

[timeframes.ts:398](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/timeframes.ts#L398)

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

[granularity.ts:64](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L64)

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

[granularity.ts:11](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L11)

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

[granularity.ts:21](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L21)

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

[granularity.ts:36](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/granularity.ts#L36)

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

[timeframes.ts:376](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/timeframes.ts#L376)

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

[timeframes.ts:386](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/timeframes.ts#L386)
