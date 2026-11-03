# @kong-ui-public/analytics-config-store

Cache analytics config information and conditionally render UI elements based on config.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)

## Features

This package provides caches for analytics config information (including whether an organization has analytics, its data retention for various products, and datasource metadata including translated field names). It does not fetch the information itself; instead, it relies on an analytics bridge to issue the necessary API calls. The cache ensures that the API calls don't need to be repeated for every component that needs the information.

This package also provides a UI component, `AnalyticsConfigCheck`, which makes it easier to hide or show elements in the UI based on the analytics config stored in the cache.

## Requirements

- `vue` and `pinia` must be initialized in the host application.
- A plugin providing an `AnalyticsBridge` must be installed in the root of the application.
  - This plugin must `provide` the necessary methods to adhere to the `AnalyticsBridge` interface defined in `@kong-ui-public/analytics-utilities`.

## Usage

Install this package in the host app alongside the component that requires it, such as `@kong-ui-public/dashboard-renderer` or `@kong-ui-public/analytics-metric-provider`.  The component will use this package without any further changes.

The config store uses the host app's Pinia instance, and must only be used after the host app has called `createPinia`.  As long as the store is only accessed during component renders, this is guaranteed to be the case.

**Note:** Pinia and this package _must_ be externalized (i.e., added to `vite.config.ts`'s `build.rollupOptions.external` array).  See notes in [[1]](https://github.com/vuejs/pinia/discussions/1073#discussioncomment-2196098) and [[2]](https://github.com/vuejs/pinia/discussions/1073#discussioncomment-6286516).  This ensures that the store uses the same instance of Pinia as the host app, rather than incorporating and using its own instance that never properly gets inited.

### Direct use of the store

When the store is first instantiated, it makes a call to retrieve the org's analytics config (using the `configFn` from `AnalyticsBridge`). Because the `AnalyticsBridge` is injected using Vue's `provide` / `inject` mechanism, the store must be instantiated either from a component's `setup` block or by using [`app.runWithContext`](https://vuejs.org/api/application.html#app-runwithcontext). Until the call to retrieve analytics config resolves, the store will return `null` for `analyticsConfig` and default values for the various computed properties.

#### Initialization timing

The store calls `configFn` only once, when the store is first created. Pinia keeps the store for the life of the app, so the store never fetches the config again, and a failed fetch is not retried.

- Create the store only when the bridge can serve `configFn`. If the bridge's requests need host state that is set later in the app's lifecycle, wait for that state before the first call to `useAnalyticsConfigStore()`. This matters most in early code such as router guards and store setup.
- `isReady()` resolves when the request succeeds and also when it fails. After a failure, `configError` holds the error, and the computed properties return their defaults (for example, `analytics` and `percentiles` are `false`). Check `configError` when a failed request must not read as "no analytics".

The store exposes several computed properties that attempt to standardize common questions asked of an org's analytics config:

- `loading` -- whether the call to retrieve config has resolved
- `longRetention` -- whether the org has a long enough retention period to support features like trend queries.
- `defaultQueryTimeForOrg` -- related to `longRetention`, this defines the length of time the app should query for contextual metrics.
- `analytics` -- a boolean value for whether the org has analytics data.
- `percentiles` -- a boolean value for whether the org's analytics data includes percentile metrics.

Note: to avoid unnecessary API calls, no queries should be issued until `loading` is `false`.  Most analytics components support a `queryReady` property; it's a good idea to pass `queryReady: !loading`.

### Direct use of the datasource config store

This package also exports `useDatasourceConfigStore`, which retrieves datasource metadata using `AnalyticsBridge.datasourceConfigFn`.

The datasource config store exposes:

- `datasourceConfig` -- the raw datasource config response
- `datasourceConfigMap` -- datasource config keyed by datasource name, with a `fieldsMap` for fast field lookups
- `getFieldDataSources` -- a getter that returns all datasource names containing a field
- `loading` -- whether the datasource config request is still pending
- `datasourceConfigError` -- the error from the datasource config request, or `null`
- `isReady` -- a promise that resolves when the datasource config request finishes, whether it succeeds or fails. After a failure, `datasourceConfig` is an empty array and `datasourceConfigError` holds the error.

Like the analytics config store, this store fetches only once, when it is first created. The [initialization timing](#initialization-timing) notes apply to it as well.

### Using `AnalyticsConfigCheck`

To conditionally show or hide UI elements based on analytics config, use the included component:

```vue
<AnalyticsConfigCheck
  require-analytics
>
  This content is only shown if the current context has access to analytics.
  <template #fallback>
    This content is only shown if the current context does **not** have access to analytics.
  </template>
</AnalyticsConfigCheck>
```

The included component takes these properties:

- `require-analytics`: only render the default slot if the config endpoint indicated support for analytics.
- `require-percentiles`: only render the default slot if the config endpoint indicated support for percentiles specifically.

It's allowed, though redundant, to specify both properties.  Doing so is equivalent to passing `require-percentiles`.

The component has two slots: `default` and `fallback`.  The default slot is rendered if the check passes, and the fallback slot is rendered if the check fails.  Both slots are empty by default.
