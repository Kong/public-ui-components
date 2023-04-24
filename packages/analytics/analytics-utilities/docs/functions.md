# Functions

## Table of contents

- [ceilToNearestTimeGrain](#ceiltonearesttimegrain)
- [datePickerSelectionToTimeframe](#datepickerselectiontotimeframe)
- [dstOffsetHours](#dstoffsethours)
- [floorToNearestTimeGrain](#floortonearesttimegrain)
- [granularitiesToOptions](#granularitiestooptions)
- [granularityMsToQuery](#granularitymstoquery)
- [msToGranularity](#mstogranularity)
- [timeframeToDatepickerSelection](#timeframetodatepickerselection)
- [timeframeToDatepickerTimeperiod](#timeframetodatepickertimeperiod)

## Detailed description

### ceilToNearestTimeGrain

▸ **ceilToNearestTimeGrain**(`date`, `granularity`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `date` | `Date` |
| `granularity` | [`GranularityKeys`](enums/GranularityKeys.md) |

#### Returns

`Date`

___

### datePickerSelectionToTimeframe

▸ **datePickerSelectionToTimeframe**(`datePickerSelection`): [`Timeframe`](classes/Timeframe.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `datePickerSelection` | [`DatePickerSelection`](types/DatePickerSelection.md) |

#### Returns

[`Timeframe`](classes/Timeframe.md)

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

___

### granularityMsToQuery

▸ **granularityMsToQuery**(`granularity`, `origin?`): [`DruidGranularity`](types/DruidGranularity.md) \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `granularity` | ``null`` \| `number` |
| `origin?` | `string` |

#### Returns

[`DruidGranularity`](types/DruidGranularity.md) \| ``null``

___

### msToGranularity

▸ **msToGranularity**(`ms?`): [`GranularityKeys`](enums/GranularityKeys.md) \| ``null``

#### Parameters

| Name | Type |
| :------ | :------ |
| `ms?` | `number` |

#### Returns

[`GranularityKeys`](enums/GranularityKeys.md) \| ``null``

___

### timeframeToDatepickerSelection

▸ **timeframeToDatepickerSelection**(`timeframe`): [`DatePickerSelection`](types/DatePickerSelection.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](classes/Timeframe.md) |

#### Returns

[`DatePickerSelection`](types/DatePickerSelection.md)

___

### timeframeToDatepickerTimeperiod

▸ **timeframeToDatepickerTimeperiod**(`timeframe`): [`TimePeriod`](types/TimePeriod.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](classes/Timeframe.md) |

#### Returns

[`TimePeriod`](types/TimePeriod.md)
