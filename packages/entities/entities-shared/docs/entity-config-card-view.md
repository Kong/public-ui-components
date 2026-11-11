# EntityConfigCardView.vue

A configuration card for an already loaded entity record. It renders the same card as [`EntityBaseConfigCard`](entity-base-config-card.md) (title, actions, format select, sensitive-field toggle and structured/JSON/YAML/Terraform/decK formats) but makes no requests, so no Axios provider, endpoint or control plane ID is needed.

Use `EntityBaseConfigCard` when the card should fetch the record itself. Entity packages also export record-driven Views with their own presentation built in, such as `ConsumerConfigCardView`.

- [Requirements](#requirements)
- [Usage](#usage)
- [Props](#props)
- [Events](#events)
- [Slots](#slots)
- [Record updates](#record-updates)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

The package's Vue, Kongponents, i18n and stylesheet setup described in the [package README](../README.md#requirements).

## Usage

The host loads the record, handles loading and errors, and mounts the View once the record is available.

```vue
<template>
  <EntityConfigCardView
    v-if="consumer"
    :config="{ app: 'konnect' }"
    :entity-type="SupportedEntityType.Consumer"
    :record="consumer"
  />
</template>

<script setup lang="ts">
import { EntityConfigCardView, SupportedEntityType } from '@kong-ui-public/entities-shared'

defineProps<{ consumer?: Record<string, any> }>()
</script>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | The entity, unwrapped from the HTTP response. It is never mutated. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Presentation and export context, see below. |
| `entityType` | `SupportedEntityType` | `undefined` | Enables Terraform (Konnect) and decK formats for the entity. |
| `subEntityType` | `string` | `''` | Event Gateway subtype for Terraform. |
| `schema` | `Record<string, any>` | `undefined` | API schema used to mask encrypted fields. |
| `configSchema` | `ConfigurationSchema` | `{}` | Field labels, tooltips, types, order, sections, `hidden` and `forceShow`. See [`configSchema`](entity-base-config-card.md#configschema). |
| `pluginConfigKey`, `pluginConfigSchema` | `string`, `PluginConfigurationSchema` | `''`, `{}` | Record key and display schema of the Plugin section. |
| `policyConfigKey`, `policyConfigSchema` | `string`, `PolicyConfigurationSchema` | `''`, `{}` | Record key and display schema of the Policy section. |
| `codeBlockRecord` | `Record<string, any>` | `undefined` | Record for the code formats when it differs from the structured record. |
| `codeBlockRecordFormatter` | `(record, format) => Record<string, any>` | Identity | Shapes a copy of the code record for each code format. |
| `preserveCodeBlockTimestamps` | `boolean` | `false` | Keep `created_at` and `updated_at` in code formats. |
| `formatsToHide` | `ConfigCardCodeFormat[]` | `[]` | Code formats to hide. The structured format is always available. |
| `hideTitle` | `boolean` | `false` | Hide the card title. |
| `titleTag` | `HeaderTag` | `'h2'` | Heading tag of the title. |

### `config`

All fields are optional.

| Field | Description |
| --- | --- |
| `app` | `'konnect'` or `'kongManager'`. Terraform is available for Konnect only. |
| `apiBaseUrl` | Kong Manager `--kong-addr` in generated decK commands. It is never requested. |
| `workspace` | Workspace written into generated decK YAML. |
| `controlPlaneName` | Konnect control plane name written into generated decK YAML. |
| `geoApiServerUrl` | Regional Konnect `--konnect-addr` in generated decK commands. |
| `enableDeckConfig` | Konnect only: enable the decK format. When the host provides the decK command editor, commands can also be edited locally. |

Format persistence, the documentation button, the request URL shown with JSON, a custom format label and Konnect token generation are features of [`EntityBaseConfigCard`](entity-base-config-card.md). Use the `actions` slot to add links or buttons to a View.

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `configFormatChange` | `ConfigCardFormat` | The user selected a format. |

## Slots

| Slot | Description |
| --- | --- |
| `title` | Card title. |
| `actions` | Content before the card's own actions. |
| `<property-key>`, `<property-key>-label`, `<property-key>-label-tooltip` | Field overrides, see [`EntityBaseConfigCard`](entity-base-config-card.md#slots). Field slots receive `record`, `row` and `rowValue`. |
| `config-card-item-<property-key>` | Replaces a whole field row. Use it for fields named `title` or `actions`, whose plain names are the card slots above. |

## Record updates

Updating `record` refreshes all formats. The selected format and the sensitive-field toggle are kept while `record.id` stays the same and reset when it changes. Use a `key` to reset the card in other cases.

## TypeScript interfaces

```ts
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
```
