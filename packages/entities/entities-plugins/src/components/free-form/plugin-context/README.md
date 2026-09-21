# Plugin Context

Use this when a plugin's form needs a flag or data from the **host app** — a
feature flag, options fetched from an API, a callback — that doesn't belong
in the plugin's schema. Prefer it over reaching into the catch-all
`FORMS_CONFIG` blob or adding one-off `inject()` calls scattered across
plugin components.

## Usage

**1. Define the type in the plugin's own directory**, e.g.
`plugins/openid-connect/context.ts`:

```ts
export interface OpenidConnectContext {
  source?: 'ai-manager'
}
```

Then import it as a type and add one entry to `PluginContextRegistry` in
[index.ts](./index.ts):

```ts
import type { OpenidConnectContext } from '../plugins/openid-connect/context'

export interface PluginContextRegistry {
  'openid-connect': OpenidConnectContext
}
```

`PluginName` (`keyof PluginContextRegistry`) is derived from this, so
`providePluginContext`/`usePluginContext` only accept plugin names listed
here, with the value type inferred from the name.

**2. Provide it** from an ancestor of the plugin's form — usually a host
wrapper around `PluginEntityForm`, since `provide`/`inject` only flows from
ancestor to descendant:

```ts
providePluginContext('openid-connect', { source: 'ai-manager' })
```

**3. Read it** inside that plugin's own form:

```ts
const context = usePluginContext('openid-connect')
```

`usePluginContext` returns `undefined` if nothing was provided — handle that
yourself (fall back to a default, throw, etc.). It only warns when some
ancestor provided context for another plugin but forgot this one; it stays
silent if nothing was ever provided at all.
