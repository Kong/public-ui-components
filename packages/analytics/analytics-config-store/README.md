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

## `AnalyticsConfigCheck`

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
