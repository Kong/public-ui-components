[@kong-ui-public/analytics-utilities](../analytics-utils.md) / Timeframe

# Class: Timeframe

## Table of contents

### Constructors

- [constructor](Timeframe.md#constructor)

### Properties

- [\_endCustom](Timeframe.md#_endcustom)
- [\_startCustom](Timeframe.md#_startcustom)
- [allowedTiers](Timeframe.md#allowedtiers)
- [dataGranularity](Timeframe.md#datagranularity)
- [defaultResponseGranularity](Timeframe.md#defaultresponsegranularity)
- [display](Timeframe.md#display)
- [isRelative](Timeframe.md#isrelative)
- [key](Timeframe.md#key)
- [timeframeLength](Timeframe.md#timeframelength)
- [timeframeText](Timeframe.md#timeframetext)

### Methods

- [allowedGranularities](Timeframe.md#allowedgranularities)
- [maximumTimeframeLength](Timeframe.md#maximumtimeframelength)
- [rawEnd](Timeframe.md#rawend)
- [rawStart](Timeframe.md#rawstart)
- [timeframeLengthMs](Timeframe.md#timeframelengthms)
- [tzAdjustedDate](Timeframe.md#tzadjusteddate)

## Constructors

### constructor

• **new Timeframe**(`opts`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | [`TimeframeOptions`](../interfaces/TimeframeOptions.md) |

#### Defined in

[timeframes.ts:60](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L60)

## Properties

### \_endCustom

• `Private` `Optional` **\_endCustom**: `Date`

#### Defined in

[timeframes.ts:58](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L58)

___

### \_startCustom

• `Private` `Optional` **\_startCustom**: `Date`

#### Defined in

[timeframes.ts:56](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L56)

___

### allowedTiers

• `Readonly` **allowedTiers**: `string`[]

#### Defined in

[timeframes.ts:38](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L38)

___

### dataGranularity

• `Readonly` **dataGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[timeframes.ts:47](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L47)

___

### defaultResponseGranularity

• `Readonly` **defaultResponseGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[timeframes.ts:42](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L42)

___

### display

• `Readonly` **display**: `string`

#### Defined in

[timeframes.ts:34](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L34)

___

### isRelative

• `Readonly` **isRelative**: `boolean`

#### Defined in

[timeframes.ts:54](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L54)

___

### key

• `Readonly` **key**: `string`

#### Defined in

[timeframes.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L32)

___

### timeframeLength

• `Readonly` **timeframeLength**: () => `number`

#### Type declaration

▸ (): `number`

##### Returns

`number`

#### Defined in

[timeframes.ts:36](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L36)

___

### timeframeText

• `Readonly` **timeframeText**: `string`

#### Defined in

[timeframes.ts:30](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L30)

## Methods

### allowedGranularities

▸ **allowedGranularities**(): `Set`<[`GranularityKeys`](../enums/GranularityKeys.md)\>

#### Returns

`Set`<[`GranularityKeys`](../enums/GranularityKeys.md)\>

#### Defined in

[timeframes.ts:96](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L96)

___

### maximumTimeframeLength

▸ **maximumTimeframeLength**(): `number`

#### Returns

`number`

#### Defined in

[timeframes.ts:91](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L91)

___

### rawEnd

▸ **rawEnd**(`_tz?`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_tz?` | `string` |

#### Returns

`Date`

#### Defined in

[timeframes.ts:76](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L76)

___

### rawStart

▸ **rawStart**(`_tz?`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_tz?` | `string` |

#### Returns

`Date`

#### Defined in

[timeframes.ts:83](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L83)

___

### timeframeLengthMs

▸ **timeframeLengthMs**(): `number`

#### Returns

`number`

#### Defined in

[timeframes.ts:87](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L87)

___

### tzAdjustedDate

▸ `Protected` **tzAdjustedDate**(`tz?`): `Date`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tz?` | `string` |

#### Returns

`Date`

#### Defined in

[timeframes.ts:123](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L123)
