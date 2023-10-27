# @kong-ui-public/analytics-metric-provider

Query data for metric cards and render default "golden signal" metrics cards using a minimum of boilerplate.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Global](#global)
  - [Single entity](#single-entity)
  - [Many entities](#many-entities)
  - [Use in tables](#use-in-tables)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

First, create a wrapper around `<MetricsProviderInternal />` in the host app.  This wrapper is in charge of feeding environment-specific properties to the metrics provider, most notably:

- `dataFetcher`, a function that calls the correct API to retrieve data for the provided query.
- `hasTrendAccess`, a boolean ref that describes whether the current user is expected to be able to run trend queries.
- `refreshInterval`, a number in milliseconds describing how often the cards should refresh.  (This value is eventually fed to the `refreshInterval` property of `useSWRV`.)

For consistency, name your wrapper `<MetricsProvider>`.  Then, use it as follows:

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

### Other properties

- `maxTimeframe`: can be provided by the host app wrapper component in order to determine the maximum timeframe that "privileged" users are allowed to query.  Essentially, if `hasTrendAccess` is `true`, this is the base timeframe that will be requested.
- `overrideTimeframe`: if the page has a time picker, setting this property overrides any automatic determination of timeframe.
- `additionalFilter`: commonly used to apply additional filters to the metric query: for example, to retrieve many entities within a given scope.
- `queryReady`: if this property is set and is `false`, the metric cards will not issue a query -- they will remain in a "loading" state.  When this property becomes `true`, the query will fire.  Useful for when the component renders before the page has all of the necessary information to construct a query.
- `longCardTitles`: whether to show the long or short translation for the title of the card.
