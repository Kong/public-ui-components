[@kong/analytics-time-utils](../API.md) / TimeframeOptions

# Interface: TimeframeOptions

## Table of contents

### Properties

- [allowedTiers](TimeframeOptions.md#allowedtiers)
- [dataGranularity](TimeframeOptions.md#datagranularity)
- [defaultResponseGranularity](TimeframeOptions.md#defaultresponsegranularity)
- [display](TimeframeOptions.md#display)
- [endCustom](TimeframeOptions.md#endcustom)
- [isRelative](TimeframeOptions.md#isrelative)
- [key](TimeframeOptions.md#key)
- [startCustom](TimeframeOptions.md#startcustom)
- [timeframeLength](TimeframeOptions.md#timeframelength)
- [timeframeText](TimeframeOptions.md#timeframetext)

## Properties

### allowedTiers

• **allowedTiers**: `string`[]

#### Defined in

[interfaces/timeframe-options.interface.ts:11](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L11)

___

### dataGranularity

• **dataGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[interfaces/timeframe-options.interface.ts:8](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L8)

___

### defaultResponseGranularity

• **defaultResponseGranularity**: [`GranularityKeys`](../enums/GranularityKeys.md)

#### Defined in

[interfaces/timeframe-options.interface.ts:7](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L7)

___

### display

• **display**: `string`

#### Defined in

[interfaces/timeframe-options.interface.ts:6](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L6)

___

### endCustom

• `Optional` **endCustom**: `Date`

#### Defined in

[interfaces/timeframe-options.interface.ts:13](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L13)

___

### isRelative

• **isRelative**: `boolean`

#### Defined in

[interfaces/timeframe-options.interface.ts:9](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L9)

___

### key

• **key**: `string`

#### Defined in

[interfaces/timeframe-options.interface.ts:4](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L4)

___

### startCustom

• `Optional` **startCustom**: `Date`

#### Defined in

[interfaces/timeframe-options.interface.ts:12](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L12)

___

### timeframeLength

• **timeframeLength**: () => `number`

#### Type declaration

▸ (): `number`

##### Returns

`number`

#### Defined in

[interfaces/timeframe-options.interface.ts:10](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L10)

___

### timeframeText

• **timeframeText**: `string`

#### Defined in

[interfaces/timeframe-options.interface.ts:5](https://github.com/Kong/shared-js/blob/main/packages/analytics-time-utils/src/interfaces/timeframe-options.interface.ts#L5)
