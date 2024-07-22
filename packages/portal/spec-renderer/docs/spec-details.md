# `SpecDetails.vue`

A Kong UI component for displaying API specs

- [Features](#features)
- [Props](#props)
  - [`document`](#document)
  - [`url`](#url)
  - [`hasSidebar`](#hassidebar)
  - [`relativeSidebar`](#relativesidebar)
  - [`essentialsOnly`](#essentialsonly)
  - [`activeOperation`](#activeoperation)

## Features

- Render `.yaml` and `.json` OAS specs
- Customize display of API specs in the UI

## Props

### `document`

- type: `String|Object`
- required: `false`
- default: `null`

Specification object or string. Required if `url` property is not set.

### `url`

- type: `String`
- required: `false`
- default: `''`

URL of the specification file. Required if `document` property is not set.

### `hasSidebar`

- type: `Boolean`
- required: `false`
- default: `false`

Whether or not the SwaggerUI navigation sidebar is enabled.

### `relativeSidebar`

- type: `Boolean`
- required: `false`
- default: `false`

Position the sidebar relatively instead of fixed.
Both `hasSidebar` and `essentialsOnly` must be `true` for the positioning to be correct since we aren't predicting the height of the info block.

### `essentialsOnly`

- type: `Boolean`
- required: `false`
- default: `false`

If enabled, only display the spec `paths` section; general information, schemes, models, actions (Authorize & Try it out), etc. are hidden.

### `activeOperation`

- type: `Object`
- required: `false`
- default: `null`

Allows to expand specification operation details section for given operation and scroll the viewport to it.

### `themeOverrides`

- type: `Object`
- required: `false`
- default: `null`

Allows the user to override objects in the SwaggerUI theme (e.g. languages for snippet support), or provide more properties that they may need in the spec.
