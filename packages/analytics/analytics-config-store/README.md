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
