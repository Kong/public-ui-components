[@kong-ui-public/analytics-utilities](../Timeframe.md) / Timeframe

# Interface: ITimeframe

The `ITimeframe` interface represents a contract for objects that define a timeframe within the application. It includes information about the timeframe's display, length, and related granularities, as well as methods for obtaining start and end dates and other timeframe-related calculations.

## Table of contents

### Properties

- [timeframeText](Timeframe.md#timeframeText)
- [key](Timeframe.md#key)
- [display](Timeframe.md#display)
- [timeframeLength](Timeframe.md#timeframeLength)
- [allowedTiers](Timeframe.md#allowedTiers)
- [defaultResponseGranularity](Timeframe.md#defaultResponseGranularity)
- [dataGranularity](Timeframe.md#dataGranularity)
- [isRelative](Timeframe.md#isRelative)

### Methods

- [rawEnd](Timeframe.md#rawEnd)
- [rawStart](Timeframe.md#rawStart)
- [timeframeLengthMs](Timeframe.md#timeframeLengthMs)
- [maximumTimeframeLength](Timeframe.md#maximumTimeframeLength)
- [allowedGranularities](Timeframe.md#allowedGranularities)

## Properties

### timeframeText

- **Type**: `string`
- **Readonly**: Yes

A textual representation of the timeframe.

### key

- **Type**: `string`
- **Readonly**: Yes

A unique key identifying the timeframe.

### display

- **Type**: `string`
- **Readonly**: Yes

The display name of the timeframe.

### timeframeLength

- **Type**: `() => number`
- **Readonly**: Yes

A method that returns the length of the timeframe in a specific unit.

### allowedTiers

- **Type**: `Array<string>`
- **Readonly**: Yes

An array of allowed tiers for the timeframe.

### defaultResponseGranularity

- **Type**: `GranularityKeys`
- **Readonly**: Yes

The default granularity of responses associated with the timeframe.

### dataGranularity

- **Type**: `GranularityKeys`
- **Readonly**: Yes

The granularity of the data within the timeframe.

### isRelative

- **Type**: `boolean`
- **Readonly**: Yes

Indicates whether the timeframe is relative (e.g., "last 7 days") as opposed to absolute (e.g., "Jan 1, 2023 - Jan 7, 2023").

## Methods

### rawEnd

▸ **rawEnd**(_tz?: `string`): `Date`

Returns the raw end date of the timeframe, possibly adjusted for the provided timezone.

#### Returns

`Date`

#### Defined in

[types/timeframe.ts:3](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts)

___

### rawStart

▸ **rawStart**(_tz?: `string`): `Date`

Returns the raw start date of the timeframe, possibly adjusted for the provided timezone.

#### Returns

`Date`

#### Defined in

[types/timeframe.ts:9](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L9)

___

### timeframeLengthMs

▸ **timeframeLengthMs**(): `number`

Calculates the length of the timeframe in milliseconds.

#### Returns

`number`

#### Defined in

[types/timeframe.ts:12](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L12)

___

### maximumTimeframeLength

▸ **maximumTimeframeLength**(): `number`

Determines the maximum allowable length of the timeframe in the same units used by `timeframeLength`.

#### Returns

`number`

#### Defined in

[types/timeframe.ts:7](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L7)

___

### allowedGranularities

▸ **allowedGranularities**(): `Set<GranularityKeys>`

Retrieves a set of granularity keys that are permissible for the timeframe.

#### Returns

`Set<GranularityKeys>`

#### Defined in

[types/timeframe.ts:5](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/timeframe.ts#L5)

