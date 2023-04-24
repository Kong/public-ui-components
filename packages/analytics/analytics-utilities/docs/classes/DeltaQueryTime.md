# Class: DeltaQueryTime

↩ [@kong-ui-public/analytics-utilities](../classes.md) / DeltaQueryTime

## Hierarchy

- [`UnaryQueryTime`](UnaryQueryTime.md)

  ↳ **`DeltaQueryTime`**

## Table of contents

### Constructors

- [constructor](DeltaQueryTime.md#constructor)

### Properties

- [timeframe](DeltaQueryTime.md#timeframe)

### Methods

- [calculateStartDate](DeltaQueryTime.md#calculatestartdate)
- [endDate](DeltaQueryTime.md#enddate)
- [endSeconds](DeltaQueryTime.md#endseconds)
- [granularityDruid](DeltaQueryTime.md#granularitydruid)
- [granularityMs](DeltaQueryTime.md#granularityms)
- [granularitySeconds](DeltaQueryTime.md#granularityseconds)
- [startDate](DeltaQueryTime.md#startdate)
- [startSeconds](DeltaQueryTime.md#startseconds)
- [withinFreeTier](DeltaQueryTime.md#withinfreetier)

## Constructors

### constructor

• **new DeltaQueryTime**(`timeframe`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](Timeframe.md) |

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[constructor](UnaryQueryTime.md#constructor)

## Properties

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[timeframe](UnaryQueryTime.md#timeframe)

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

[UnaryQueryTime](UnaryQueryTime.md).[calculateStartDate](UnaryQueryTime.md#calculatestartdate)

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endDate](UnaryQueryTime.md#enddate)

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endSeconds](UnaryQueryTime.md#endseconds)

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../types/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../types/DruidGranularity.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularityDruid](UnaryQueryTime.md#granularitydruid)

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[granularityMs](UnaryQueryTime.md#granularityms)

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularitySeconds](UnaryQueryTime.md#granularityseconds)

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[startDate](UnaryQueryTime.md#startdate)

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[startSeconds](UnaryQueryTime.md#startseconds)

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[withinFreeTier](UnaryQueryTime.md#withinfreetier)
