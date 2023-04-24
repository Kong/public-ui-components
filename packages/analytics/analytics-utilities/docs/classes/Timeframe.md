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

## Constructors

### constructor

• **new Timeframe**(`opts`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | [`TimeframeOptions`](../interfaces/TimeframeOptions.md) |

#### Defined in

[timeframes.ts:51](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L51)

## Properties

### \_endCustom

• `Private` `Optional` **\_endCustom**: `Date`

#### Defined in

[timeframes.ts:49](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L49)

___

### \_startCustom

• `Private` `Optional` **\_startCustom**: `Date`

#### Defined in

[timeframes.ts:47](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L47)

___

### allowedTiers

• `Readonly` **allowedTiers**: `string`[]

#### Defined in

[timeframes.ts:29](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L29)

___

### dataGranularity

• `Readonly` **dataGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[timeframes.ts:38](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L38)

___

### defaultResponseGranularity

• `Readonly` **defaultResponseGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[timeframes.ts:33](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L33)

___

### display

• `Readonly` **display**: `string`

#### Defined in

[timeframes.ts:25](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L25)

___

### isRelative

• `Readonly` **isRelative**: `boolean`

#### Defined in

[timeframes.ts:45](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L45)

___

### key

• `Readonly` **key**: `string`

#### Defined in

[timeframes.ts:23](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L23)

___

### timeframeLength

• `Readonly` **timeframeLength**: () => `number`

#### Type declaration

▸ (): `number`

##### Returns

`number`

#### Defined in

[timeframes.ts:27](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L27)

___

### timeframeText

• `Readonly` **timeframeText**: `string`

#### Defined in

[timeframes.ts:21](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L21)

## Methods

### allowedGranularities

▸ **allowedGranularities**(): `Set`<[`GranularityKeys`](../enums/GranularityKeys.md)\>

#### Returns

`Set`<[`GranularityKeys`](../enums/GranularityKeys.md)\>

#### Defined in

[timeframes.ts:85](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L85)

___

### maximumTimeframeLength

▸ **maximumTimeframeLength**(): `number`

#### Returns

`number`

#### Defined in

[timeframes.ts:80](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L80)

___

### rawEnd

▸ **rawEnd**(): `Date`

#### Returns

`Date`

#### Defined in

[timeframes.ts:66](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L66)

___

### rawStart

▸ **rawStart**(): `Date`

#### Returns

`Date`

#### Defined in

[timeframes.ts:72](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L72)

___

### timeframeLengthMs

▸ **timeframeLengthMs**(): `number`

#### Returns

`number`

#### Defined in

[timeframes.ts:76](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L76)
