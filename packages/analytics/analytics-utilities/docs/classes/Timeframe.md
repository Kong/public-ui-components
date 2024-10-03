[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / Timeframe

# Class: Timeframe

## Implements

- [`ITimeframe`](../interfaces/ITimeframe.md)

## Constructors

### new Timeframe()

> **new Timeframe**(`opts`): [`Timeframe`](Timeframe.md)

#### Parameters

• **opts**: [`TimeframeOptions`](../interfaces/TimeframeOptions.md)

#### Returns

[`Timeframe`](Timeframe.md)

#### Defined in

[timeframes.ts:62](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L62)

## Properties

### allowedTiers

> `readonly` **allowedTiers**: `string`[]

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`allowedTiers`](../interfaces/ITimeframe.md#allowedtiers)

#### Defined in

[timeframes.ts:40](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L40)

***

### dataGranularity

> `readonly` **dataGranularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`dataGranularity`](../interfaces/ITimeframe.md#datagranularity)

#### Defined in

[timeframes.ts:49](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L49)

***

### defaultResponseGranularity

> `readonly` **defaultResponseGranularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`defaultResponseGranularity`](../interfaces/ITimeframe.md#defaultresponsegranularity)

#### Defined in

[timeframes.ts:44](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L44)

***

### display

> `readonly` **display**: `string`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`display`](../interfaces/ITimeframe.md#display)

#### Defined in

[timeframes.ts:36](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L36)

***

### isRelative

> `readonly` **isRelative**: `boolean`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`isRelative`](../interfaces/ITimeframe.md#isrelative)

#### Defined in

[timeframes.ts:56](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L56)

***

### key

> `readonly` **key**: `"15m"` \| `"1h"` \| `"6h"` \| `"12h"` \| `"24h"` \| `"7d"` \| `"30d"` \| `"current_week"` \| `"current_month"` \| `"previous_week"` \| `"previous_month"` \| `"custom"`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`key`](../interfaces/ITimeframe.md#key)

#### Defined in

[timeframes.ts:34](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L34)

***

### timeframeLength()

> `readonly` **timeframeLength**: () => `number`

#### Returns

`number`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`timeframeLength`](../interfaces/ITimeframe.md#timeframelength)

#### Defined in

[timeframes.ts:38](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L38)

***

### timeframeText

> `readonly` **timeframeText**: `string`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`timeframeText`](../interfaces/ITimeframe.md#timeframetext)

#### Defined in

[timeframes.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L32)

## Methods

### allowedGranularities()

> **allowedGranularities**(): `Set`\<`"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`\>

#### Returns

`Set`\<`"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`\>

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`allowedGranularities`](../interfaces/ITimeframe.md#allowedgranularities)

#### Defined in

[timeframes.ts:98](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L98)

***

### cacheKey()

> **cacheKey**(): `string`

#### Returns

`string`

#### Defined in

[timeframes.ts:125](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L125)

***

### maximumTimeframeLength()

> **maximumTimeframeLength**(): `number`

#### Returns

`number`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`maximumTimeframeLength`](../interfaces/ITimeframe.md#maximumtimeframelength)

#### Defined in

[timeframes.ts:93](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L93)

***

### rawEnd()

> **rawEnd**(`_tz`?): `Date`

#### Parameters

• **\_tz?**: `string`

#### Returns

`Date`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`rawEnd`](../interfaces/ITimeframe.md#rawend)

#### Defined in

[timeframes.ts:78](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L78)

***

### rawStart()

> **rawStart**(`_tz`?): `Date`

#### Parameters

• **\_tz?**: `string`

#### Returns

`Date`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`rawStart`](../interfaces/ITimeframe.md#rawstart)

#### Defined in

[timeframes.ts:85](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L85)

***

### timeframeLengthMs()

> **timeframeLengthMs**(): `number`

#### Returns

`number`

#### Implementation of

[`ITimeframe`](../interfaces/ITimeframe.md).[`timeframeLengthMs`](../interfaces/ITimeframe.md#timeframelengthms)

#### Defined in

[timeframes.ts:89](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L89)

***

### tzAdjustedDate()

> `protected` **tzAdjustedDate**(`tz`?): `Date`

#### Parameters

• **tz?**: `string`

#### Returns

`Date`

#### Defined in

[timeframes.ts:152](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L152)

***

### v4Query()

> **v4Query**(`tz`?): [`TimeRangeV4`](../type-aliases/TimeRangeV4.md)

#### Parameters

• **tz?**: `string`

#### Returns

[`TimeRangeV4`](../type-aliases/TimeRangeV4.md)

#### Defined in

[timeframes.ts:134](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/timeframes.ts#L134)
