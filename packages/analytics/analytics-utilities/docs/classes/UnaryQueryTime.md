[@kong-ui-public/analytics-utilities](../analytics-utils.md) / UnaryQueryTime

# Class: UnaryQueryTime

## Hierarchy

- `BaseQueryTime`

  ↳ **`UnaryQueryTime`**

  ↳↳ [`DeltaQueryTime`](DeltaQueryTime.md)

## Table of contents

### Constructors

- [constructor](UnaryQueryTime.md#constructor)

### Properties

- [timeframe](UnaryQueryTime.md#timeframe)
- [tz](UnaryQueryTime.md#tz)

### Methods

- [calculateStartDate](UnaryQueryTime.md#calculatestartdate)
- [endDate](UnaryQueryTime.md#enddate)
- [endMs](UnaryQueryTime.md#endms)
- [endSeconds](UnaryQueryTime.md#endseconds)
- [granularityDruid](UnaryQueryTime.md#granularitydruid)
- [granularityMs](UnaryQueryTime.md#granularityms)
- [granularitySeconds](UnaryQueryTime.md#granularityseconds)
- [startDate](UnaryQueryTime.md#startdate)
- [startMs](UnaryQueryTime.md#startms)
- [startSeconds](UnaryQueryTime.md#startseconds)
- [withinFreeTier](UnaryQueryTime.md#withinfreetier)

## Constructors

### constructor

• **new UnaryQueryTime**(`timeframe`, `tz?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](Timeframe.md) |
| `tz?` | `string` |

#### Inherited from

BaseQueryTime.constructor

#### Defined in

[queryTime.ts:16](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L16)

## Properties

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

BaseQueryTime.timeframe

#### Defined in

[queryTime.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L13)

___

### tz

• `Protected` `Optional` `Readonly` **tz**: `string`

#### Inherited from

BaseQueryTime.tz

#### Defined in

[queryTime.ts:14](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L14)

## Methods

### calculateStartDate

▸ `Protected` **calculateStartDate**(`isRelative`, `granularity`, `periods?`): `Date`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `isRelative` | `boolean` | `undefined` |
| `granularity` | [`GranularityKeys`](../enums/GranularityKeys.md) | `undefined` |
| `periods` | `number` | `1` |

#### Returns

`Date`

#### Inherited from

BaseQueryTime.calculateStartDate

#### Defined in

[queryTime.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L32)

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.endDate

#### Defined in

[queryTime.ts:120](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L120)

___

### endMs

▸ **endMs**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.endMs

#### Defined in

[queryTime.ts:77](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L77)

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.endSeconds

#### Defined in

[queryTime.ts:67](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L67)

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

BaseQueryTime.granularityDruid

#### Defined in

[queryTime.ts:57](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L57)

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

BaseQueryTime.granularityMs

#### Defined in

[queryTime.ts:124](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L124)

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.granularitySeconds

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.startDate

#### Defined in

[queryTime.ts:116](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L116)

___

### startMs

▸ **startMs**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.startMs

#### Defined in

[queryTime.ts:72](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L72)

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.startSeconds

#### Defined in

[queryTime.ts:62](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L62)

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

BaseQueryTime.withinFreeTier

#### Defined in

[queryTime.ts:82](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L82)
