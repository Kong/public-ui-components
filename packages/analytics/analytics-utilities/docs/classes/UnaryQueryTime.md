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

#### Defined in

[queryTime.ts:15](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L15)

## Properties

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

[queryTime.ts:106](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L106)

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

[queryTime.ts:110](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L110)

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

[queryTime.ts:102](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L102)

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
