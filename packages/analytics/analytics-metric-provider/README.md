# @kong-ui-public/analytics-metric-provider

Query data for metric cards and render default "golden signal" metrics cards using a minimum of boilerplate.

- [@kong-ui-public/analytics-metric-provider](#kong-ui-publicanalytics-metric-provider)
  - [Requirements](#requirements)
  - [Usage](#usage)
    - [Global](#global)
    - [Single entity](#single-entity)
    - [Many entities](#many-entities)
    - [Use in tables](#use-in-tables)
    - [CSS Variables](#css-variables)
  - [Props](#props)
  - [Exports](#exports)
    - [Types](#types)
    - [Enums](#enums)

## Requirements

- `vue` and `pinia` must be initialized in the host application.
  - The `pinia` requirement comes from the `analytics-config-store` package; see the [README](../analytics-config-store/README.md) for further details.
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KIcon`
  - `KSkeletonBox`
  - `KTooltip`
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `@kong-ui-public/analytics-config-store` must be available as a `dependency` in the host application.
- A plugin providing an `AnalyticsBridge` must be installed in the root of the application.
  - This plugin must `provide` the necessary methods to adhere to the `AnalyticsBridge` interface defined in `@kong-ui-public/analytics-utilities`.
  - The plugin's query method is in charge of passing the query to the correct API for the host app's environment.
  - See the sandbox app (`./sandbox/App.vue`) for an example that returns a mock response rather than consuming an API.

## Usage

### Global

To query across all data for an organization, no properties are needed.  The provider's determination of whether the user has trend access is available as a slot property for translation purposes.

```vue
<MetricsProvider v-slot="{ hasTrendAccess }">
  <div>
    {{ hasTrendAccess ?
      i18n.t('otherTier') : i18n.t('freeTier') }}
  </div>
  <MetricsConsumer />
</MetricsProvider>
```

### Single entity

To query data for a single entity, specify the dimension and the filter value.

```vue
<MetricsProvider :dimension="EXPLORE_V2_DIMENSIONS.ROUTE" :filter-value="routeUUID">
  <MetricsConsumer />
</MetricsProvider>
```

This pattern is a convenience; it's equivalent to passing an `additional-filter` prop with this data:

```json
[
  {
    "dimension": "ROUTE",
    "type": "IN",
    "values": ["routeUUID"]
  }
]
```

### Many entities

To issue a group by query that returns data for many entities: specify the dimension, then provide the lookup key to the consumer.

```vue
<MetricsProvider :dimension="EXPLORE_V2_DIMENSIONS.ROUTE">
  <div v-for="item in data">
    <MetricsConsumer
      :card-size="MetricCardSize.Small"
      :lookup-key="item.name"
    />
  </div>
</MetricsProvider>
```

### Use in tables

The provider and consumer support use in contexts where metric cards are not appropriate to display the data.

```vue
<MetricsProvider :dimension="EXPLORE_V2_DIMENSIONS.ROUTE">
  <KTable>
    <template #requests="{ row }">
      <MetricsConsumer
        v-slot="{ cardValues }"
        :lookup-key="row.name"
      >
        {{ cardValues.trafficCard.currentValue }}
      </MetricsConsumer>
    </template>
    <template #error_rate="{ row }">
      <MetricsConsumer
        v-slot="{ cardValues }"
        :lookup-key="row.name"
      >
        {{ cardValues.errorRateFormatted }}
      </MetricsConsumer>
    </template>
    <template #p99_latency="{ row }">
      <MetricsConsumer
        v-slot="{ cardValues }"
        :lookup-key="row.name"
      >
        {{ cardValues.latencyFormatted }}
      </MetricsConsumer>
    </template>
  </KTable>
</MetricsProvider>
```

## Props

- `maxTimeframe`: can be provided by the host app wrapper component in order to determine the maximum timeframe that "privileged" users are allowed to query.  Essentially, if `hasTrendAccess` is `true`, this is the base timeframe that will be requested.
- `overrideTimeframe`: if the page has a time picker, setting this property overrides any automatic determination of timeframe.
- `additionalFilter`: commonly used to apply additional filters to the metric query: for example, to retrieve many entities within a given scope.
- `queryReady`: if this property is set and is `false`, the metric cards will not issue a query -- they will remain in a "loading" state.  When this property becomes `true`, the query will fire.  Useful for when the component renders before the page has all of the necessary information to construct a query.
- `longCardTitles`: whether to show the long or short translation for the title of the card.

## Exports

### Types

- MetricCardDef

### Enums

- MetricCardSize
- MetricCardType
