# Class: UnaryQueryTime

↩ [@kong-ui-public/analytics-utilities](../classes.md) / UnaryQueryTime

## Hierarchy

- `BaseQueryTime`

  ↳ **`UnaryQueryTime`**

  ↳↳ [`DeltaQueryTime`](DeltaQueryTime.md)

## Table of contents

### Constructors

- [constructor](UnaryQueryTime.md#constructor)

### Properties

- [timeframe](UnaryQueryTime.md#timeframe)

### Methods

- [calculateStartDate](UnaryQueryTime.md#calculatestartdate)
- [endDate](UnaryQueryTime.md#enddate)
- [endSeconds](UnaryQueryTime.md#endseconds)
- [granularityDruid](UnaryQueryTime.md#granularitydruid)
- [granularityMs](UnaryQueryTime.md#granularityms)
- [granularitySeconds](UnaryQueryTime.md#granularityseconds)
- [startDate](UnaryQueryTime.md#startdate)
- [startSeconds](UnaryQueryTime.md#startseconds)
- [withinFreeTier](UnaryQueryTime.md#withinfreetier)

## Constructors

### constructor

• **new UnaryQueryTime**(`timeframe`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](Timeframe.md) |

#### Inherited from

BaseQueryTime.constructor

## Properties

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

BaseQueryTime.timeframe

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

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.endDate

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.endSeconds

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../types/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../types/DruidGranularity.md)

#### Inherited from

BaseQueryTime.granularityDruid

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

BaseQueryTime.granularityMs

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.granularitySeconds

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.startDate

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.startSeconds

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

BaseQueryTime.withinFreeTier
