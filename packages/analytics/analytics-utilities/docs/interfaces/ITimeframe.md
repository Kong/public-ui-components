[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / ITimeframe

# Interface: ITimeframe

## Properties

### allowedTiers

> `readonly` **allowedTiers**: `string`[]

#### Defined in

[types/timeframe.ts:8](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L8)

***

### dataGranularity

> `readonly` **dataGranularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Defined in

[types/timeframe.ts:10](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L10)

***

### defaultResponseGranularity

> `readonly` **defaultResponseGranularity**: `"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`

#### Defined in

[types/timeframe.ts:9](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L9)

***

### display

> `readonly` **display**: `string`

#### Defined in

[types/timeframe.ts:6](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L6)

***

### isRelative

> `readonly` **isRelative**: `boolean`

#### Defined in

[types/timeframe.ts:11](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L11)

***

### key

> `readonly` **key**: `string`

#### Defined in

[types/timeframe.ts:5](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L5)

***

### timeframeLength()

> `readonly` **timeframeLength**: () => `number`

#### Returns

`number`

#### Defined in

[types/timeframe.ts:7](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L7)

***

### timeframeText

> `readonly` **timeframeText**: `string`

#### Defined in

[types/timeframe.ts:4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L4)

## Methods

### allowedGranularities()

> **allowedGranularities**(): `Set`\<`"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`\>

#### Returns

`Set`\<`"secondly"` \| `"minutely"` \| `"hourly"` \| `"daily"` \| `"weekly"` \| `"trend"`\>

#### Defined in

[types/timeframe.ts:16](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L16)

***

### maximumTimeframeLength()

> **maximumTimeframeLength**(): `number`

#### Returns

`number`

#### Defined in

[types/timeframe.ts:15](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L15)

***

### rawEnd()

> **rawEnd**(`_tz`?): `Date`

#### Parameters

• **\_tz?**: `string`

#### Returns

`Date`

#### Defined in

[types/timeframe.ts:12](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L12)

***

### rawStart()

> **rawStart**(`_tz`?): `Date`

#### Parameters

• **\_tz?**: `string`

#### Returns

`Date`

#### Defined in

[types/timeframe.ts:13](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L13)

***

### timeframeLengthMs()

> **timeframeLengthMs**(): `number`

#### Returns

`number`

#### Defined in

[types/timeframe.ts:14](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L14)
