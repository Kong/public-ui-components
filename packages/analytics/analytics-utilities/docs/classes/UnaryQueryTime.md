[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / UnaryQueryTime

# Class: UnaryQueryTime

## Extends

- `BaseQueryTime`

## Extended by

- [`DeltaQueryTime`](DeltaQueryTime.md)

## Constructors

### new UnaryQueryTime()

> **new UnaryQueryTime**(`timeframe`, `tz`?): [`UnaryQueryTime`](UnaryQueryTime.md)

#### Parameters

• **timeframe**: [`Timeframe`](Timeframe.md)

• **tz?**: `string`

#### Returns

[`UnaryQueryTime`](UnaryQueryTime.md)

#### Inherited from

`BaseQueryTime.constructor`

#### Defined in

[queryTime.ts:16](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L16)

## Properties

### timeframe

> `protected` `readonly` **timeframe**: [`Timeframe`](Timeframe.md)

#### Inherited from

`BaseQueryTime.timeframe`

#### Defined in

[queryTime.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L13)

***

### tz?

> `protected` `readonly` `optional` **tz**: `string`

#### Inherited from

`BaseQueryTime.tz`

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

`BaseQueryTime.calculateStartDate`

#### Defined in

[queryTime.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L32)

***

### endDate()

> **endDate**(): `Date`

#### Returns

`Date`

#### Overrides

`BaseQueryTime.endDate`

#### Defined in

[queryTime.ts:120](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L120)

***

### endMs()

> **endMs**(): `number`

#### Returns

`number`

#### Inherited from

`BaseQueryTime.endMs`

#### Defined in

[queryTime.ts:77](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L77)

***

### endSeconds()

> **endSeconds**(): `number`

#### Returns

`number`

#### Inherited from

`BaseQueryTime.endSeconds`

#### Defined in

[queryTime.ts:67](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L67)

***

### granularityDruid()

> **granularityDruid**(): `null` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Returns

`null` \| [`DruidGranularity`](../interfaces/DruidGranularity.md)

#### Inherited from

`BaseQueryTime.granularityDruid`

#### Defined in

[queryTime.ts:57](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L57)

***

### granularityMs()

> **granularityMs**(): `number`

#### Returns

`number`

#### Overrides

`BaseQueryTime.granularityMs`

#### Defined in

[queryTime.ts:124](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L124)

***

### granularitySeconds()

> **granularitySeconds**(): `number`

#### Returns

`number`

#### Inherited from

`BaseQueryTime.granularitySeconds`

#### Defined in

[queryTime.ts:53](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L53)

***

### startDate()

> **startDate**(): `Date`

#### Returns

`Date`

#### Overrides

`BaseQueryTime.startDate`

#### Defined in

[queryTime.ts:116](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L116)

***

### startMs()

> **startMs**(): `number`

#### Returns

`number`

#### Inherited from

`BaseQueryTime.startMs`

#### Defined in

[queryTime.ts:72](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L72)

***

### startSeconds()

> **startSeconds**(): `number`

#### Returns

`number`

#### Inherited from

`BaseQueryTime.startSeconds`

#### Defined in

[queryTime.ts:62](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L62)

***

### withinFreeTier()

> **withinFreeTier**(): `boolean`

#### Returns

`boolean`

#### Inherited from

`BaseQueryTime.withinFreeTier`

#### Defined in

[queryTime.ts:82](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/queryTime.ts#L82)
