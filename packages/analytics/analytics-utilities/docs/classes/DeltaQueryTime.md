[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / DeltaQueryTime

# Class: DeltaQueryTime

## Extends

- [`UnaryQueryTime`](UnaryQueryTime.md)

## Constructors

### new DeltaQueryTime()

> **new DeltaQueryTime**(`timeframe`, `tz`?): [`DeltaQueryTime`](DeltaQueryTime.md)

#### Parameters

• **timeframe**: [`Timeframe`](Timeframe.md)

• **tz?**: `string`

#### Returns

[`DeltaQueryTime`](DeltaQueryTime.md)

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`constructor`](UnaryQueryTime.md#constructors)

#### Defined in

[queryTime.ts:16](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L16)

## Properties

### timeframe

> `protected` `readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`timeframe`](UnaryQueryTime.md#timeframe)

#### Defined in

[queryTime.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L13)

***

### tz?

> `protected` `readonly` `optional` **tz**: `string`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`tz`](UnaryQueryTime.md#tz)

#### Defined in

[queryTime.ts:14](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L14)

## Methods

### calculateStartDate()

> `protected` **calculateStartDate**(`isRelative`, `granularity`, `periods`): `Date`

#### Parameters

• **isRelative**: `boolean`

• **granularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

• **periods**: `number` = `1`

#### Returns

`Date`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`calculateStartDate`](UnaryQueryTime.md#calculatestartdate)

#### Defined in

[queryTime.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L32)

***

### endDate()

> **endDate**(): `Date`

#### Returns

`Date`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`endDate`](UnaryQueryTime.md#enddate)

#### Defined in

[queryTime.ts:120](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L120)

***

### endMs()

> **endMs**(): `number`

#### Returns

`number`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`endMs`](UnaryQueryTime.md#endms)

#### Defined in

[queryTime.ts:77](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L77)

***

### endSeconds()

> **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`endSeconds`](UnaryQueryTime.md#endseconds)

#### Defined in

[queryTime.ts:67](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L67)

***

### granularityDruid()

> **granularityDruid**(): `null` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

`null` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`granularityDruid`](UnaryQueryTime.md#granularitydruid)

#### Defined in

[queryTime.ts:57](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L57)

***

### granularityMs()

> **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

[`UnaryQueryTime`](UnaryQueryTime.md).[`granularityMs`](UnaryQueryTime.md#granularityms)

#### Defined in

[queryTime.ts:137](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L137)

***

### granularitySeconds()

> **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`granularitySeconds`](UnaryQueryTime.md#granularityseconds)

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

***

### startDate()

> **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

[`UnaryQueryTime`](UnaryQueryTime.md).[`startDate`](UnaryQueryTime.md#startdate)

#### Defined in

[queryTime.ts:133](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L133)

***

### startMs()

> **startMs**(): `number`

#### Returns

`number`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`startMs`](UnaryQueryTime.md#startms)

#### Defined in

[queryTime.ts:72](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L72)

***

### startSeconds()

> **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`startSeconds`](UnaryQueryTime.md#startseconds)

#### Defined in

[queryTime.ts:62](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L62)

***

### withinFreeTier()

> **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`UnaryQueryTime`](UnaryQueryTime.md).[`withinFreeTier`](UnaryQueryTime.md#withinfreetier)

#### Defined in

[queryTime.ts:82](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L82)
