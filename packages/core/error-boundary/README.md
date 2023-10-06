# @kong-ui-public/error-boundary

A Vue error boundary component to capture unhandled errors that allows for providing a fallback UI and error callback function via [Vue's `onErrorCaptured` hook](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
  - [Slots](#slots)
  - [Props](#props)

## Features

- Renderless (by default) Vue component that **captures** uncaught errors from child components and **prevents the error from propagating further**
- Allows passing in a list of [tags](#tags) to forward along to the [`onError` callback function](#onerror).
- Allows providing an error callback function (defined inline or during global Vue plugin initialization)
- Provides a [`fallback` slot](#fallback) to allow a host app to provide an error UI
- Allows for **nested** `ErrorBoundary` components in the DOM. Any nested `ErrorBoundary` components will inherit the tags of its ancestors
- See the package `sandbox` for more examples

The `ErrorBoundary` component will **always** capture any unhandled errors and prevent them from further propagating. This is essentially saying "this error has been handled and should be ignored." It will prevent any additional `ErrorBoundary` components from receiving the error and prevent additional `errorCaptured` hooks or `app.config.errorHandler` from being invoked for this error.

The `ErrorBoundary` component can be used to wrap a single component or an entire tree of children, tagging any errors that are captured in the DOM tree.

When nesting `ErrorBoundary` components, the [`tags`](#tags) from any parent `ErrorBoundary` component will be passed down to its children and included in their `ErrorBoundaryCallbackParams`.

```html
<template>
  <div class="my-page">
    <!-- 1 -->
    <ErrorBoundary :tags="['team-settings']">
      <SettingsComponent />
      <form>
        <!-- 2 -->
        <ErrorBoundary :tags="['team-billing']">
          <BuggyComponent />
          <!-- 3 -->
          <ErrorBoundary :tags="['team-core-ui']">
            <CreditCardComponent />
            <!-- The fallback slot has access to all params -->
            <template #fallback="{ error, context }">
              <div class="fallback-content">
                <p>This component has custom fallback UI; most likely just an icon, etc.</p>
                <p class="error-message">{{ context.componentName }}: {{ error.message }}</p>
              </div>
            </template>
          </ErrorBoundary>
        <ActionButtonsComponent />
        </ErrorBoundary>
      </form>
    </ErrorBoundary>
  </div>
</template>
```

Looking at the numbered examples above:

1. `team-settings` will be tagged if any child of this component throws an uncaught error, including the `<SettingsComponent>` all the way down to the `<CreditCardComponent>`
2. `team-settings` and `team-billing` will be tagged for anything inside the `<form>` element
3. `team-core-ui` will **only** be tagged if the `<CreditCardComponent>` throws an error, as it is the only DOM child of its error boundary.

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the package in your host application

```sh
yarn add @kong-ui-public/error-boundary
```

### Register

You can register the `ErrorBoundary` component in your app [globally](#global-registration) or [locally](#in-component-registration) in another component.

> **Note**: There are no style imports for this package.

#### Global Registration

When registering the component globally via the default export Vue plugin, you may provide a default [`onError` callback](#onerror) to be used throughout your application for all instances of the `ErrorBoundary` component.

You may still override this global callback on individual instances of the component by passing a function to the [`onError` component prop](#onerror). _(This includes providing an empty function to disable the global behavior)_

```typescript
// Global registration
import { createApp } from 'vue'
import ErrorBoundary from '@kong-ui-public/error-boundary' // No style imports needed
// Datadog package example
import { datadogRum } from '@datadog/browser-rum'

const app = createApp(App)

app.use(ErrorBoundary, {
  // Provide a global, default `onError` callback for all ErrorBoundary instances
  onError({ error, context }) {
    // Example of sending errors to Datadog
    datadogRum.addError(error, {
      ui: context,
    })
  },
})
```

#### In-Component Registration

When registering the component locally, you can provide the `onError` callback as a prop.

```html
<!-- Local registration -->
<template>
  <ErrorBoundary
    :on-error="customErrorCallback"
    :tags="myTags"
  >
    <BuggyComponent />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ErrorBoundary } from '@kong-ui-public/error-boundary' // No style imports needed

const myTags = ['first-tag', 'another-tag']
const customErrorCallback = ({ error, context }) => {
  // Do something fancy
}
</script>
```

### Slots

#### `default`

The `default` slot should be utilized for your "potentially buggy" Vue component(s). The `default` slot can handle a single child, or an entire tree of child components/elements.

#### `fallback`

The `fallback` slot can optionally be used to provide a fallback UI should any child component (not already wrapped with another `ErrorBoundary` component) thrown an unhandled error. **The default fallback behavior is to render nothing in the UI.**

The `fallback` slot has access to all of the `ErrorBoundaryCallbackParams` as slot props:

```html
<ErrorBoundary :tags="myTags">
  <BuggyComponent />
  <template #fallback="{ error, context }">
    <!-- Your fallback UI here -->
  </template>
</ErrorBoundary>
```

### Props

#### `tags`

- type: `String[]`
- required: `false`
- default: `[]`

A list of strings to "tag" the captured error with that are passed along to the `onError` callback.

For example, if you want to provide custom attributes to errors on Datadog, you can pass in an array of strings to add to the logged error's custom attributes.

#### `onError`

- type: `Function as PropType<(params: ErrorBoundaryCallbackParams) => void>`
- required: `false`
- default: `[]`

A function to be called from the `ErrorBoundary` component when an error in a child component is captured. Receives params of [ErrorBoundaryCallbackParams](src/types/error-boundary.ts).

> **Note**: Providing a callback function via the `onError` prop will take precedence over any callback function defined during global registration. You can also provide an empty function in order to prevent the global callback from being executed.
