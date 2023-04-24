# Class: TimeseriesQueryTime

↩ [@kong-ui-public/analytics-utilities](../classes.md) / TimeseriesQueryTime

## Hierarchy

- `BaseQueryTime`

  ↳ **`TimeseriesQueryTime`**

## Table of contents

### Constructors

- [constructor](TimeseriesQueryTime.md#constructor)

### Properties

- [granularity](TimeseriesQueryTime.md#granularity)
- [timeframe](TimeseriesQueryTime.md#timeframe)

### Methods

- [calculateStartDate](TimeseriesQueryTime.md#calculatestartdate)
- [endDate](TimeseriesQueryTime.md#enddate)
- [endSeconds](TimeseriesQueryTime.md#endseconds)
- [granularityDruid](TimeseriesQueryTime.md#granularitydruid)
- [granularityMs](TimeseriesQueryTime.md#granularityms)
- [granularitySeconds](TimeseriesQueryTime.md#granularityseconds)
- [startDate](TimeseriesQueryTime.md#startdate)
- [startSeconds](TimeseriesQueryTime.md#startseconds)
- [withinFreeTier](TimeseriesQueryTime.md#withinfreetier)

## Constructors

### constructor

• **new TimeseriesQueryTime**(`timeframe`, `granularity?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](Timeframe.md) |
| `granularity?` | [`GranularityKeys`](../enums/GranularityKeys.md) |

#### Overrides

BaseQueryTime.constructor

## Properties

### granularity

• `Private` `Readonly` **granularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

___

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
