# @kong-ui-public/analytics-utilities

Commonly used types, interfaces and utils used with Kong analytics.

- [Features](#features)
- [Usage](#usage)
  - [Install](#install)
  - [Unit Test naming conventions](#unit-test-naming-conventions)
  - [TypeScript interfaces](#typescript-interfaces)

## Features

- Common types, interfaces and utils for Kong analytics

## Usage

- Install and import/use types and utils as needed

### Install

```sh
  yarn add @kong-ui-public/analytics-utilities
```

### Unit Test naming conventions

All unit tests are ran with Vitest.

- For normal unit tests, please use the `*.spec.ts` format
- For unit tests that need to run once per timezonem, use the format `*.spec.tz.ts` (defined in the package's `package.json -> scripts -> test:unit:{timezone}` section)

### TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types) and can be directly imported into your host application. The following interfaces are available for import:

```ts
import type { AnalyticsExploreResult, AnalyticsExploreMeta } from '@kong-ui-publicic/analytics-utilities'
```
