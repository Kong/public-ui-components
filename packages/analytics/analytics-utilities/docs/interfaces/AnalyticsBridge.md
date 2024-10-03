[**@kong-ui-public/analytics-utilities**](../README.md) • **Docs**

***

[@kong-ui-public/analytics-utilities](../README.md) / AnalyticsBridge

# Interface: AnalyticsBridge

## Properties

### configFn()

> **configFn**: () => `Promise`\<[`AnalyticsConfigV2`](AnalyticsConfigV2.md)\>

#### Returns

`Promise`\<[`AnalyticsConfigV2`](AnalyticsConfigV2.md)\>

#### Defined in

[types/query-bridge.ts:26](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/query-bridge.ts#L26)

***

### evaluateFeatureFlagFn()

> **evaluateFeatureFlagFn**: \<`T`\>(`key`, `defaultValue`) => `T`

#### Type Parameters

• **T** = `boolean`

#### Parameters

• **key**: `string`

• **defaultValue**: `T`

#### Returns

`T`

#### Defined in

[types/query-bridge.ts:32](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/query-bridge.ts#L32)

***

### queryFn()

> **queryFn**: (`query`, `abortController`) => `Promise`\<[`ExploreResultV4`](ExploreResultV4.md)\>

#### Parameters

• **query**: [`DatasourceAwareQuery`](../type-aliases/DatasourceAwareQuery.md)

• **abortController**: `AbortController`

#### Returns

`Promise`\<[`ExploreResultV4`](ExploreResultV4.md)\>

#### Defined in

[types/query-bridge.ts:23](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/query-bridge.ts#L23)
