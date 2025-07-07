# @kong-ui-public/entities-plugins-icon

Plugin icon package that provides a set of icons for Kong Gateway plugins.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [example](#example)

## Features

- Provides a set of icons for Kong Gateway plugins

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the package in your host application:

```sh
pnpm install @kong-ui-public/entities-plugins-icon
```

### Props
- name: `string` - The name of the plugin icon to display.
- size: `number` - The size of the icon in pixels. Default is `32`.
- alt: `string` - The alt text for the icon. Default is `''`.

### example
```vue
<template>
  <PluginIcon
    name="key-auth"
    size="32"
  />
</template>
```
