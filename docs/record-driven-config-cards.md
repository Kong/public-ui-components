# Record-driven configuration cards

Configuration cards have two public entry points. Existing `*ConfigCard` components own loading and continue to fetch their entity, schema and associations. New `*ConfigCardView` components accept resolved records and perform no entity, schema or association reads. Both paths use the same presentation implementation.

Mount a View after its record is available. The application owns loading, errors and retry. A View never interprets a missing record as permission to fetch. No query library, Axios provider, control plane ID or endpoint is needed to render a View.

## Public components

Import components and their `*ConfigCardViewProps` types from the package root.

| Package (`@kong-ui-public/…`) | Existing reader | Record-driven presentation | Additional presentation inputs |
| --- | --- | --- | --- |
| `entities-shared` | `EntityBaseConfigCard` | `EntityConfigCardView` | Entity type, field schema, optional resolved API schema |
| `entities-consumers` | `ConsumerConfigCard` | `ConsumerConfigCardView` | Consumer field tooltips and hidden fields are built in |
| `entities-consumer-groups` | `ConsumerGroupConfigCard` | `ConsumerGroupConfigCardView` | Pass the resolved group, not its HTTP envelope |
| `entities-gateway-services` | `GatewayServiceConfigCard` | `GatewayServiceConfigCardView` | TLS display rules and field slots are built in |
| `entities-routes` | `RouteConfigCard` | `RouteConfigCardView` | Optional `serviceName`, `serviceNameLoading`; falls back to service ID |
| `entities-certificates` | `CertificateConfigCard` | `CertificateConfigCardView` | Certificate parsing is local; server metadata must already be in the record |
| `entities-certificates` | `CACertificateConfigCard` | `CACertificateConfigCardView` | Same local certificate parsing boundary |
| `entities-keys` | `KeyConfigCard` | `KeyConfigCardView` | Optional `keySetName`, `keySetNameLoading`; JWK/PEM expansion is local |
| `entities-key-sets` | `KeySetConfigCard` | `KeySetConfigCardView` | Key set field display is built in |
| `entities-vaults` | `VaultConfigCard` | `VaultConfigCardView` | `config.apiType: 'aiGateway'` selects AI Gateway domain mapping |
| `entities-plugins` | `PluginConfigCard` | `PluginConfigCardView` | Required `schema`; optional `referenceEntities` and link context |
| `entities-upstreams-targets` | `UpstreamsConfigCard` | `UpstreamsConfigCardView` | Health check and hash field display is built in |
| `entities-redis-configurations` | `RedisConfigurationConfigCard` | `RedisConfigurationConfigCardView` | `recordKind: 'partial'` (default) or `'managed-cache'`; optional cloud authentication flag |

`EntityConfigCardView` is the full card: title, actions, format selection, sensitive-field control and contents. `ConfigCardDisplay` remains the lower-level format/field body with its existing API.

## Shared View interface

`record` is required and is the resolved entity. `entityType` is required on the generic View. Presentation props retain existing names: `configSchema`, `pluginConfigKey`, `pluginConfigSchema`, `policyConfigKey`, `policyConfigSchema`, `subEntityType`, `codeBlockRecordFormatter`, `preserveCodeBlockTimestamps`, `hideTitle`, `titleTag`, `label`, `configCardDoc` and `formatsToHide`.

Optional `config: EntityConfigCardViewConfig` contains presentation context only: app-specific export formats, format preference key, decK settings and command context. `requestUrl` is optional display metadata for the JSON panel; the View never requests it. `schema` accepts an already resolved API schema; an existing schema provider is also supported. Schemas and records are read without mutation.

Use `codeBlockRecord` when the code representation differs from the structured record. `codeBlockRecordRedacted` can supply an explicitly prepared masked representation. The formatter runs on an independent clone, before optional timestamp stripping. Generic code copy behavior remains compatible with existing cards: it can copy the original unredacted representation. Vault presentation always masks its sensitive configuration fields, including copy/export output.

The generic View emits `configFormatChange`. It does not emit request/loading events. Field slots retain `record`, `row` and `rowValue`; title and actions slots remain available. Business Views retain their navigation events and accept slot overrides. Format selection and sensitive visibility survive updates to the same `record.id`; sensitive visibility and decK customization reset when that identity changes. Remount with `:key` for records without a stable ID or when changing business scope.

```vue
<script setup lang="ts">
import { EntityConfigCardView, SupportedEntityType } from '@kong-ui-public/entities-shared'
// `consumer` is supplied by the application's data owner.
defineProps<{ consumer?: Record<string, any> }>()
</script>

<template>
  <EntityConfigCardView
    v-if="consumer"
    :record="consumer"
    :entity-type="SupportedEntityType.Consumer"
  />
</template>
```

## Domain presentation

Pass the business API record to `VaultConfigCardView`. It performs the same AI Gateway-to-Gateway display mapping as the existing card, including auth-method-specific HashiCorp field names, labels, ordering and unconditional masking. Do not pre-map it with internal mapper functions. HTTP envelope unwrapping remains the responsibility of the data owner.

```vue
<VaultConfigCardView
  v-if="vault"
  :key="vault.id"
  :record="vault"
  :config="{ apiType: 'aiGateway' }"
/>
```

Plugin schema is a separate data requirement. The View does not fetch it and does not render a potentially sensitive plugin record when schema fields are unavailable. `referenceEntities` is a map of `service`, `route`, `consumer`, and `consumer_group` to `{ id, name?, loading? }`. Names are used only when their ID matches the record, `showNameAsLink` is true and `config.showScopeName` is enabled. Missing names display IDs. Link route builders only build routes; they must not perform reads.

```vue
<PluginConfigCardView
  v-if="plugin && pluginSchema"
  :record="plugin"
  :schema="pluginSchema"
  :config="{ pluginType: plugin.name, showScopeName: true }"
  show-name-as-link
  :reference-entities="{
    service: { id: plugin.service?.id, name: service?.name, loading: serviceLoading },
  }"
/>
```

Redis owners resolve whether the detail is a partial or managed cache before mounting the View. Pass the original resolved partial/add-on record and the corresponding `recordKind`. The View applies flattening, cloud-auth display rules, managed field allowlisting and format-specific code transforms. Applications displaying both managed cache and linked partial segments own those records and segment loading; changing the View's inputs never requests the other source.

Terraform, YAML and decK conversion is local. decK command customization retains the existing optional editor provider. The View's `enableDeckConfig.customization` accepts a boolean for local editing. Token generation remains in existing reader containers; external data owners can supply their own action through the actions slot. `getConfigCardViewConfig` projects a legacy configuration into presentation context and removes token-generation callbacks.

## Vault edit and Secret components

`VaultForm.initialRecord` initializes a cloned draft once per mounted editor. A ready initial record skips the legacy initialization GET. Set `fetchOnMount=false` explicitly when the external record might arrive later: this disables initialization GET even while the record is absent. Subsequent query updates do not overwrite edits. Use `:key="vault.id"` when switching objects. The form still owns its normal write requests, config-store creation, validation and errors. `EntityBaseForm.fetchOnMount` also defaults to true and controls only its legacy initialization read.

`SecretList` and `SecretForm` accept optional `configStoreId`. A valid supplied ID bypasses the Vault lookup and enters the existing Secret component. Null or empty strings do not render the inner component and do not fall back to a Vault request. Omitted/undefined retains the existing Vault-resolution behavior. For asynchronous queries, mount after a valid store ID is available; passing undefined does not disable resolution. Changes to store, Vault, API scope or Secret identity rebuild the inner state; stale Vault responses cannot overwrite a newer explicit store ID.

```vue
<VaultForm
  v-if="vault"
  :key="vault.id"
  :config="vaultFormConfig"
  :vault-id="vault.id"
  :initial-record="vault"
  :fetch-on-mount="false"
/>
<SecretList
  v-if="vault?.config?.config_store_id"
  :config="secretListConfig"
  :vault-id="vault.id"
  :config-store-id="vault.config.config_store_id"
/>
<SecretForm
  v-if="vault?.config?.config_store_id"
  :config="secretFormConfig"
  :vault-id="vault.id"
  :config-store-id="vault.config.config_store_id"
  :secret-id="secretId"
/>
```

Secret listing, edit reads, writes and deletion continue using the configured API's config-store paths. These components retain data behavior and do not have a View suffix.

## Migration and release order

1. Release the changed `entities-shared` package and the business packages listed above through the repository's normal automated publishing workflow. Do not manually bump versions or publish packages. Update the application to compatible released versions together; its bundle must resolve the new shared exports.
2. Reuse page query results for Auth Strategy/Consumer, Consumer Group, Policy and external Vault cards. Use the business View where domain rules exist, and the generic View for application-defined field/policy schemas. Keep schema queries as independent data needs.
3. Pass a resolved Konnect Vault's config-store ID to Secret lists and create/edit forms. Initialize Vault edit forms with `initialRecord` and disable automatic initialization reads.
4. Remove request adapters and local duplicate configuration/Vault cards once all consumers use these entry points. No HTTP response fabrication, cache or interceptor is necessary.
5. Verify a normal page mount performs one entity-detail GET from its query owner. User retry, explicit refresh and necessary post-save invalidation remain legitimate reads.

Existing callers can continue using reader components unchanged. URL interpolation, workspace scope, `dataKey`, raw `recordResolver`/`codeBlockRecordResolver` boundaries, original request-event payloads and error UI remain in `EntityBaseConfigCard`. Its default scoped slot is the shared business-container boundary; it renders one business View after successful loading, rather than rendering a second card alongside the reader.
