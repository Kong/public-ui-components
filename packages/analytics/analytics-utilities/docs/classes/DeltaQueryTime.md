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
- [tz](DeltaQueryTime.md#tz)

### Methods

- [calculateStartDate](DeltaQueryTime.md#calculatestartdate)
- [endDate](DeltaQueryTime.md#enddate)
- [endMs](DeltaQueryTime.md#endms)
- [endSeconds](DeltaQueryTime.md#endseconds)
- [granularityDruid](DeltaQueryTime.md#granularitydruid)
- [granularityMs](DeltaQueryTime.md#granularityms)
- [granularitySeconds](DeltaQueryTime.md#granularityseconds)
- [startDate](DeltaQueryTime.md#startdate)
- [startMs](DeltaQueryTime.md#startms)
- [startSeconds](DeltaQueryTime.md#startseconds)
- [withinFreeTier](DeltaQueryTime.md#withinfreetier)

## Constructors

### constructor

• **new DeltaQueryTime**(`timeframe`, `tz?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeframe` | [`Timeframe`](Timeframe.md) |
| `tz?` | `string` |

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[constructor](UnaryQueryTime.md#constructor)

#### Defined in

[queryTime.ts:16](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L16)

## Properties

### timeframe

• `Protected` `Readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[timeframe](UnaryQueryTime.md#timeframe)

#### Defined in

[queryTime.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L13)

___

### tz

• `Protected` `Optional` `Readonly` **tz**: `string`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[tz](UnaryQueryTime.md#tz)

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

[UnaryQueryTime](UnaryQueryTime.md).[calculateStartDate](UnaryQueryTime.md#calculatestartdate)

#### Defined in

[queryTime.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L32)

___

### endDate

▸ **endDate**(): `Date`

#### Returns

`Date`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endDate](UnaryQueryTime.md#enddate)

#### Defined in

[queryTime.ts:120](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L120)

___

### endMs

▸ **endMs**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endMs](UnaryQueryTime.md#endms)

#### Defined in

[queryTime.ts:77](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L77)

___

### endSeconds

▸ **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[endSeconds](UnaryQueryTime.md#endseconds)

#### Defined in

[queryTime.ts:67](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L67)

___

### granularityDruid

▸ **granularityDruid**(): ``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

``null`` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularityDruid](UnaryQueryTime.md#granularitydruid)

#### Defined in

[queryTime.ts:57](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L57)

___

### granularityMs

▸ **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[granularityMs](UnaryQueryTime.md#granularityms)

#### Defined in

[queryTime.ts:137](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L137)

___

### granularitySeconds

▸ **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[granularitySeconds](UnaryQueryTime.md#granularityseconds)

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

___

### startDate

▸ **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

[UnaryQueryTime](UnaryQueryTime.md).[startDate](UnaryQueryTime.md#startdate)

#### Defined in

[queryTime.ts:133](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L133)

___

### startMs

▸ **startMs**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[startMs](UnaryQueryTime.md#startms)

#### Defined in

[queryTime.ts:72](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L72)

___

### startSeconds

▸ **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[startSeconds](UnaryQueryTime.md#startseconds)

#### Defined in

[queryTime.ts:62](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L62)

___

### withinFreeTier

▸ **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[UnaryQueryTime](UnaryQueryTime.md).[withinFreeTier](UnaryQueryTime.md#withinfreetier)

#### Defined in

[queryTime.ts:82](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L82)
