# @kong-ui-public/analytics-config-store

Cache analytics config information and conditionally render UI elements based on config.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)

## Features

This package provides a cache for analytics config information (including whether an organization has analytics, its data retention for various products, etc).  It does not fetch the information itself; instead, it relies on an analytics bridge to issue the necessary API call.  The cache ensures that the API call doesn't need to be repeated for every component that needs the information.

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

When the store is first instantiated, it makes a call to retrieve the org's analytics config (using the `configFn` from `AnalyticsBridge`).  Because the `AnalyticsBridge` is injected using Vue's `provide` / `inject` mechanism, the store must be instantiated either from a component's `setup` block or by using [`app.runWithContext`](https://vuejs.org/api/application.html#app-runwithcontext).  Until the call to retrieve analytics config resolves, the store will return `null` for `analyticsConfig` and default values for the various computed properties.

The store exposes several computed properties that attempt to standardize common questions asked of an org's analytics config:

- `loading` -- whether the call to retrieve config has resolved
- `longRetention` -- whether the org has a long enough retention period to support features like trend queries.
- `defaultQueryTimeForOrg` -- related to `longRetention`, this defines the length of time the app should query for contextual metrics.
- `analytics` -- a boolean value for whether the org has analytics data.
- `percentiles` -- a boolean value for whether the org's analytics data includes percentile metrics.

Note: to avoid unnecessary API calls, no queries should be issued until `loading` is `false`.  Most analytics components support a `queryReady` property; it's a good idea to pass `queryReady: !loading`.

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
