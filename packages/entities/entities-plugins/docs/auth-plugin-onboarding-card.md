# AuthPluginOnboardingCard.vue

A dismissible "next steps" banner shown on an auth plugin's detail page after the plugin is created. It guides the user to create a consumer/principal (and, once one exists, add a credential) so they can test the plugin's configuration.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `pluginType`

- type: `AuthOnboardingPluginType`
- required: `true`
- default: `undefined`

The auth plugin type this banner is shown for. One of `'basic-auth' | 'key-auth' | 'key-auth-enc' | 'oauth2' | 'hmac-auth' | 'jwt' | 'acl'`. Drives the plugin-specific copy used for the `consumers` and `centrally-managed` auth modes.

#### `authMode`

- type: `AuthMode`
- required: `true`
- default: `undefined`

Which mode the plugin was configured to manage authentication with: `'consumers' | 'centrally-managed' | 'kong-identity'`. `consumers` and `centrally-managed` share the same, plugin-specific copy (only the navigation targets differ); `kong-identity` uses generic "principal" copy that doesn't vary by `pluginType`.

#### `hasExistingEntity`

- type: `Boolean`
- required: `true`
- default: `undefined`

Whether the current control plane/workspace already has at least one entity matching the required kind for `authMode` (a consumer for `consumers`/`centrally-managed`, a principal for `kong-identity`). Controls whether the second ("add a credential") item is shown.

#### `createEntityTo`

- type: `RouteLocationRaw`
- required: `true`
- default: `undefined`

Route to navigate to for creating a consumer/principal with a matching credential/grant.

#### `addCredentialTo`

- type: `RouteLocationRaw`
- required: `false`
- default: `undefined`

Route to navigate to for adding a credential/grant to an existing consumer/principal. If omitted, only the "create" item is shown, regardless of `hasExistingEntity`.

### Events

#### dismiss

A `@dismiss` event is emitted when the user closes the card. The card owns no dismissed/hidden state itself - the host application should use this event to stop rendering it (e.g. by toggling a `v-if`).

### Usage example

Please refer to the [sandbox](../sandbox/pages/AuthPluginOnboardingCardPage.vue).

## TypeScript interfaces

TypeScript interfaces are available and can be directly imported into your host application:

```ts
import type { AuthMode, AuthOnboardingPluginType } from '@kong-ui-public/entities-plugins'
```
