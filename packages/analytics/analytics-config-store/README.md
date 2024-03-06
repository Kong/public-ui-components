# @kong-ui-public/analytics-config-store

Cache analytics config information.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)

## Features

This package provides a cache for analytics config information (including whether an organization has analytics, its data retention for various products, etc).  It does not fetch the information itself; instead, it relies on an analytics bridge to issue the necessary API call.  The cache ensures that the API call doesn't need to be repeated for every component that needs the information.

## Requirements

- `vue` and `pinia` must be initialized in the host application.
- A plugin providing an `AnalyticsBridge` must be installed in the root of the application.
  - This plugin must `provide` the necessary methods to adhere to the `AnalyticsBridge` interface defined in `@kong-ui-public/analytics-utilities`.

## Usage

Install this package in the host app alongside the component that requires it, such as `@kong-ui-public/dashboard-renderer` or `@kong-ui-public/analytics-metric-provider`.  The component will use this package without any further changes.

The config store uses the host app's Pinia instance, and must only be used after the host app has called `createPinia`.  As long as the store is only accessed during component renders, this is guaranteed to be the case.

**Note:** Pinia and this package _must_ be externalized (i.e., added to `vite.config.ts`'s `build.rollupOptions.external` array).  See notes in [[1]](https://github.com/vuejs/pinia/discussions/1073#discussioncomment-2196098) and [[2]](https://github.com/vuejs/pinia/discussions/1073#discussioncomment-6286516).  This ensures that the store uses the same instance of Pinia as the host app, rather than incorporating and using its own instance that never properly gets inited.
