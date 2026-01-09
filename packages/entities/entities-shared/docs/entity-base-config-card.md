# EntityBaseConfigCard.vue

A base display component for an entity's record data.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Sections](#sections)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect' | 'kongManager'`
    - required: `true`
    - default: `undefined`
    - App name.

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Base URL for API requests.

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creation of an entity.

  - `workspace`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Kong Manager*. Name of the current workspace.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

  - `enableDeckConfig`:
    - type: `boolean`
    - required: `false`
    - default: `undefined`
    - *Specific to Konnect*. Enable the decK configuration format option.

  - `entityId`:
    - type: `Object`
    - required: `true`
    - default: `undefined`
    - The ID of the entity to display record data for.

The base konnect or kongManger config.

#### `fetchUrl`

- type: `String`
- required: `true`
- default: `''`

Fetch url for the entity to display record data for. We will handle the replacement of {controlPlaneId}, {workspace}, and {id}.
Value should NOT contain config.apiBaseUrl, as we auto include this. Typically this will just an entry from the endpoints file.

ex. `/api/runtime_groups/{controlPlaneId}/services/{id}`

#### `dataKey`

- type: `String`
- required: `false`
- default: `''`

Optional key to use to access the record from fetched `response.data`. If not provided, `response.data` will be used.

#### `configSchema`

- type: `ConfigurationSchema`
- required: `false`
- default: `{}`

Schema to configure the display of record fields. Each field can be displayed in one of two predefined sections: 'basic' (displayed first) or 'advanced' (displayed second). See [sections](#sections) for more details.

See the [pluginConfigSchema](#pluginconfigschema) prop for an explanation of how to use the `plugin` section.

By default, entries will be rendered as plain text but we allow you specify a `ConfigurationSchemaType` to use one of our predefined display patterns which include: copyable ids (with values masked or not), internal/external links, dates (for unix timestamps), badges (for stats, tags, and request methods), and json content.

Each field supports the following properties:

```ts
interface ConfigurationSchemaItem {
  // entry label and tooltip if label has one, if not provided we will title case the property key
  label?: string
  tooltip?: string
  // determines what component should be used to render the value, defaults to plain text
  type?: ConfigurationSchemaType
  // determines what order the entries are displayed in, unordered fields will be displayed at the end
  order?: number
  // determines whether or not to render the entry, by default `hidden` is `false`
  hidden?: boolean
  // determines which section the entry is displayed in, defaults to 'advanced'
  section?: ConfigurationSchemaSection
  // if true, the entry will be rendered even if not provided in the response object (with null value)
  forceShow?: boolean
}
```

#### `pluginConfigKey`

- type: `String`
- required: `false`
- default: `''`

Plugin records have a separate section specifically for the configuration, the typical key is `config`. If you are rendering a Plugin record, use the prop to specify the key of the configuration object in the record response.

#### `pluginConfigSchema`

- type: `PluginConfigurationSchema`
- required: `false`
- default: `{}`

Similar to the `configSchema` prop, you can use this prop to specify the configuration for the Plugin section. The options remain the same, except that you can't specify the `section` as that will be set to `plugin` for you.

Each field supports the following properties:

```ts
interface PluginConfigurationSchemaItem {
  // entry label and tooltip if label has one, if not provided we will title case the property key
  label?: string
  tooltip?: string
  // determines what component should be used to render the value, defaults to plain text
  type?: ConfigurationSchemaType
  // determines what order the entries are displayed in, unordered fields will be displayed at the end with fields that have a value taking priority
  order?: number
  // determines whether or not to render the entry, by default `hidden` is `false`
  hidden?: boolean
  // if true, the entry will be rendered even if not provided in the response object (with null value)
  forceShow?: boolean
}
```

#### `hideTitle`

- type: `Boolean`
- required: `false`
- default: `false`

Controls the visibility of the card's title and `title` slot. A value of `true` will hide the `title` content (including slot content).

#### `configCardDoc`

- type: `String`
- required: `false`
- default: `null`

External link for documentation. Controls the visibility of the documentation button.

#### `titleTag`

HTML element you want title to be rendered as. Defaults to `h2`.

### Sections

There are 3 sections that properties can be displayed in: `basic`, `advanced`, and `plugin`.

#### Default Sections

For most entities there will on be a `basic` and (optionally) an `advanced` section for properties to be displayed in. The `basic` section is displayed first and the `advanced` section is displayed after. If a `section` isn't provided the property will be displayed in the `advanced` section.

By default the `basic` section contains the common properties shared across entities: `id`, `name`, `enabled`, `updated_at`, `created_at`, and `tags`. The `EntityBaseConfigCard` will handle rendering these properties in the correct order with the correct `label` without any extra configuration. Properties defined with `type: ConfigurationSchemaSection.Basic` will be rendered directly above the `tags` property.

#### Plugin Section

This section is displayed last.

For the `plugins` entity, the response contains a `config` object which we need the ability to easily define a config schema for. In order to use the `plugin` section as intended it should be used with the [`pluginConfigKey`](#pluginconfigkey) and [`pluginConfigSchema`](#pluginconfigschema) props.

### Events

#### loading

A `@loading` event is emitted whenever the loading state changes. This is only triggered when fetching the record's data.

#### fetch:success

A `@fetch:success` event is emitted when the GET of the entity succeeded. The event payload is the entity item data object.

#### fetch:error

A `@fetch:error` event is emitted when the GET of the entity failed. The event payload is the AxiosError.

### Slots

#### title

Content to display for the card title. Displayed in the upper left corner.

#### actions

Content to be displayed to the left of the card's 'Copy JSON' action in the top right corner of the card.

#### <property-key>

Slot what is displayed for the value content of a specific property in the record.

#### <property-key>-label

Slot what is displayed for the label content of a specific property in the record. By default, dash and underscore separated strings will be converted into title case (ex. 'some-prop' => 'Some Prop').

#### <property-key>-label-tooltip

Slot what is displayed for the label tooltip content of a specific property in the record.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityBaseFormPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-base-config-card.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseEntityConfig,
  KonnectBaseEntityConfig,
  KongManagerBaseEntityConfig,
  ConfigurationSchema,
  ConfigurationSchemaItem,
  PluginConfigurationSchema,
  PluginConfigurationSchemaItem,
  ConfigurationSchemaType,
  ConfigurationSchemaSection,
} from '@kong-ui-public/entities-shared'
```
