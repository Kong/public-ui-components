[@kong-ui-public/analytics-utilities](../analytics-utils.md) / DeltaQueryTime

# Class: DeltaQueryTime

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

#### Defined in

[queryTime.ts:15](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L15)

## Properties

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[timeframe](UnaryQueryTime.md#timeframe)

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

[UnaryQueryTime](UnaryQueryTime.md).[calculateStartDate](UnaryQueryTime.md#calculatestartdate)

#### Defined in

[queryTime.ts:30](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L30)

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endDate](UnaryQueryTime.md#enddate)

#### Defined in

[queryTime.ts:106](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L106)

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endSeconds](UnaryQueryTime.md#endseconds)

#### Defined in

[queryTime.ts:63](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L63)

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularityDruid](UnaryQueryTime.md#granularitydruid)

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[granularityMs](UnaryQueryTime.md#granularityms)

#### Defined in

[queryTime.ts:123](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L123)

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularitySeconds](UnaryQueryTime.md#granularityseconds)

#### Defined in

[queryTime.ts:49](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L49)

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[startDate](UnaryQueryTime.md#startdate)

#### Defined in

[queryTime.ts:119](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L119)

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[startSeconds](UnaryQueryTime.md#startseconds)

#### Defined in

[queryTime.ts:58](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L58)

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[withinFreeTier](UnaryQueryTime.md#withinfreetier)

#### Defined in

[queryTime.ts:68](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L68)
