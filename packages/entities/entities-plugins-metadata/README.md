# @kong-ui-public/entities-plugins-metadata

Plugin metadata management package that provides static metadata for Kong Gateway plugins.

- [Features](#features)
- [Usage](#usage)
  - [Install](#install)
  - [Import](#import)
- [Why this package?](#why-this-package)

## Features

- Provides static plugin metadata including:
  - Plugin groups (Authentication, Security, Traffic Control, etc.)
  - Plugin scopes (Global, Service, Route, Consumer, Consumer Group)
- Exports TypeScript enums for plugin groups and plugin scopes

## Usage

### Install

Install the package in your host application:

```sh
yarn add @kong-ui-public/entities-plugins-metadata
```

### Import

```ts
import { 
  PLUGIN_GROUP_AND_SCOPE_MAP,
  PluginGroup,
  PluginScope 
} from '@kong-ui-public/entities-plugins-metadata'
```

The package exports:
- `PLUGIN_GROUP_AND_SCOPE_MAP`: Mapping of plugin names to their groups and supported scopes
- `PluginGroup`: Enum of available plugin groups
- `PluginScope`: Enum of available plugin scopes

## Why this package?

Previously, the mapping of plugin names to their groups and supported scopes lived in the `@kong-ui-public/entities-plugins` package. Now it is a separate package, providing a consistent and reliable source of plugin metadata to be consumed by various front-end and back-end applications. It contains a simple mapping without introducing any complexity or dependencies.
