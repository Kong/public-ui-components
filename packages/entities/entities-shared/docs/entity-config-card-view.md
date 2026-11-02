# EntityConfigCardView.vue

A complete configuration card for an already resolved entity record. It includes the title, actions, format selector, sensitive-field control and display body. It performs no entity, schema or association reads and requires no query library, Axios provider, control plane ID or request endpoint.

Use `EntityBaseConfigCard` when the component should fetch the record. Both components share the same presentation. `ConfigCardDisplay` remains the lower-level field/format body.

## Requirements

Use the package's existing Vue, Kongponents, i18n and stylesheet setup described in the [package README](../README.md#requirements). The View does not require an HTTP-client provider.

## Import

```ts
import { EntityConfigCardView } from '@kong-ui-public/entities-shared'
import type { EntityConfigCardViewProps, EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
```

## Props

| Prop | Type | Required / default | Description |
| --- | --- | --- | --- |
| `record` | `Record<string, any>` | Required | Resolved entity. Unwrap HTTP envelopes before passing it. |
| `entityType` | `SupportedEntityType` | `undefined` | Enables type-specific Terraform/decK exports. Omit for structured, JSON and YAML only. |
| `subEntityType` | `string` | `''` | Subtype for Event Gateway exports. |
| `config` | `EntityConfigCardViewConfig` | `{}` | Optional presentation context; see below. |
| `schema` | `Record<string, any>` | `undefined` | Resolved API schema. An existing schema provider is also supported. No schema lookup occurs. |
| `configSchema` | `ConfigurationSchema` | `{}` | Field types, labels, order, sections, hidden fields and `forceShow`. |
| `pluginConfigKey`, `policyConfigKey` | `string` | `''` | Record keys displayed in the plugin/policy sections. |
| `pluginConfigSchema` | `PluginConfigurationSchema` | `{}` | Display configuration for plugin fields. |
| `policyConfigSchema` | `PolicyConfigurationSchema` | `{}` | Display configuration for policy fields. |
| `codeBlockRecord` | `Record<string, any>` | `undefined` | Optional code representation when it differs from the structured record. |
| `codeBlockRecordFormatter` | `(record, format: ConfigCardCodeFormat) => Record<string, any>` | Identity | Local code shaping, applied to an independent clone before timestamp stripping. |
| `preserveCodeBlockTimestamps` | `boolean` | `false` | Keep `created_at` and `updated_at` in code formats. |
| `hideTitle` | `boolean` | `false` | Hide the title and title slot. |
| `titleTag` | `HeaderTag` | `'h2'` | Title heading tag. |
| `label` | `string` | `'Format: '` | Format-selector label. |
| `configCardDoc` | `string` | `''` | HTTP(S) or relative documentation URL. Invalid URLs and other schemes hide the button. |
| `formatsToHide` | `ConfigCardCodeFormat[]` | `[]` | Hide code formats; structured display remains available. |

Only `record` is required. Entity type and subtype describe local export conversion, not HTTP endpoints. Omitting `entityType` disables Terraform and decK; business Views supply their own fixed type. Removing metadata for the selected export returns to structured display.

Field configuration uses the same [schema and section semantics as EntityBaseConfigCard](entity-base-config-card.md#configschema). Missing `forceShow` fields are added to a derived record; caller records and schemas are never modified. Existing null/empty-value ordering, timestamps and managed-field behavior are preserved.

### Presentation context

`EntityConfigCardViewConfig` accepts optional `app`, `formatPreferenceKey`, `enableDeckConfig`, `deckCalloutPreferenceKey`, `controlPlaneName`, `geoApiServerUrl`, `apiBaseUrl` and `workspace`. App/export metadata selects applicable formats and builds displayed commands; it does not enable requests.

`enableDeckConfig` accepts a boolean or `{ customization?: boolean, calloutPreferenceKey?: string }`. Terraform, YAML and decK conversion and command editing are local. decK customization uses the existing optional editor provider. Token generation remains in reader containers; an external data owner can supply its own control in the actions slot. Legacy request metadata, resolver ordering and token callbacks are handled privately by reader containers; no adaptation helper is required by View callers.

### Code representation and sensitive fields

The View does not accept request URLs, `dataKey`, response resolvers, pre-redacted code records or request configuration. Keep HTTP envelope unwrapping and non-invertible response transformations in the data owner, and pass an explicit `codeBlockRecord` only when the structured record cannot represent the full export payload. Provide unredacted data and schemas; the View derives the masked representation.

API-schema redaction runs before display-schema redaction. The formatter receives a clone, and optional timestamp stripping follows formatting. Generic code copy behavior remains compatible with existing cards and can copy the unredacted representation. Business-specific masking rules, such as the Vault card's unconditional masking, belong to the corresponding business View.

## Events and slots

The View emits `configFormatChange` with the selected `ConfigCardFormat`. It emits no `loading`, `fetch:success` or `fetch:error` events.

Title, actions and field slots retain their existing names. Field overrides receive `record`, `row` and `rowValue`; label/whole-row slots retain the parameters documented for [EntityBaseConfigCard](entity-base-config-card.md#slots).

## Record updates and mounting

The data owner handles loading, errors and retry and mounts the View after a record is available. An absent record never authorizes a fallback GET. Updates refresh structured fields and code formats without resetting the format or sensitive-field choice for the same `record.id`. An identity change resets sensitive visibility and decK customization. Use a Vue `key` when changing business scope or displaying records without stable IDs.

```vue
<script setup lang="ts">
import { EntityConfigCardView } from '@kong-ui-public/entities-shared'

defineProps<{ consumer?: Record<string, any> }>()
</script>

<template>
  <EntityConfigCardView
    v-if="consumer"
    :record="consumer"
  />
</template>
```

Existing callers can keep `EntityBaseConfigCard` unchanged. Its URL interpolation, workspace scope, `dataKey`, response/code resolvers, original request-event payloads and error UI remain in the reader. When migrating, use a compatible published `entities-shared` version, move loading/error handling to the existing data owner, and remove any response-fabrication adapter. Schema remains a separate data requirement; explicit retry, refresh and necessary post-save reads remain valid.
