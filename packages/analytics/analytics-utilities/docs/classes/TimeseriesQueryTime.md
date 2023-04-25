[@kong-ui-public/analytics-utilities](../analytics-utils.md) / TimeseriesQueryTime

# Class: TimeseriesQueryTime

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

#### Defined in

[queryTime.ts:77](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L77)

## Properties

### granularity

• `Private` `Readonly` **granularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[queryTime.ts:75](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L75)

___

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

BaseQueryTime.timeframe

#### Defined in

[queryTime.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L13)

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

[queryTime.ts:30](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L30)

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.endDate

#### Defined in

[queryTime.ts:91](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L91)

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.endSeconds

#### Defined in

[queryTime.ts:63](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L63)

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

BaseQueryTime.granularityDruid

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

BaseQueryTime.granularityMs

#### Defined in

[queryTime.ts:95](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L95)

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.granularitySeconds

#### Defined in

[queryTime.ts:49](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L49)

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

BaseQueryTime.startDate

#### Defined in

[queryTime.ts:87](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L87)

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

BaseQueryTime.startSeconds

#### Defined in

[queryTime.ts:58](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L58)

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

BaseQueryTime.withinFreeTier

#### Defined in

[queryTime.ts:68](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L68)
