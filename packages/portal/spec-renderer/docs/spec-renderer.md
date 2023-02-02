# `SpecRenderer.vue`

A Kong UI component for displaying and filtering API specs

- [Features](#features)
- [Props](#props)
  - [`spec`](#spec)
  - [`essentialsOnly`](#essentialsonly)
  - [`operationsList`](#operationslist)
  - [`tags`](#tags)
  - [`navWidth`](#navwidth)
- [Slots](#slots)
  - [`error-state`](#error-state)

## Features

- Render spec with side nav and filtering

## Props

### `spec`

- type: `Object`
- required: `true`

Specification object or string.

### `essentialsOnly`

- type: `Boolean`
- required: `false`
- default: `false`

If enabled, only display the spec `paths` section; general information, schemes, models, actions (Authorize & Try it out), etc. are hidden.

### `operationsList`

- type: `Object[]`
- required: `true`

Operation object array. Required.
The objects should conform to the following interface.

```typescript
{
  /**
   * Relative operation path with optional path templating.
   * See https://swagger.io/specification/#paths-object
   */
  path: string
  /**
   * HTTP Method
   */
  method: string
  /**
   * Optional operationId
   */
  operationId: string | null
  /**
   * List of tag names for the operation used to group operations into sections
   */
  tags: string[]
  /**
   * Short summary of the operation
   */
  summary: string | null
  /**
   * Is the operation deprecated?
   */
  deprecated: boolean
}
```

### `tags`

- type: `Object[]`
- required: `false`
- default: `[]`

Object array for tags. You can use this to specify tag information such as `description` and `externalDocs`.

```typescript
{
  /**
   * Tag name
   * See {@link Operation.tags} for usage details
   */
  name: string
  /**
   * Optional description.
   * CommonMark formatting is not supported at the moment.
   */
  description?: string
  /**
   * Optional link to external docs of the tag
   */
  externalDocs?: {
    description?: string
    url: string
  }
}
```

### `navWidth`

- type: `String`
- required: `false`
- default: `310`

Controls the width of the side nav. Currently supports numbers (will be converted to px), auto, `vw`, `vh`, and percentages for width.

## Slots

### `error-state`

Controls the content when `spec` is not provided.

