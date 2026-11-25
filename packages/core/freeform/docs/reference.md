# Reference

## Injection Keys

| Key | Purpose |
|---|---|
| `FIELD_RENDERERS` | Slot name for custom renderers (`Form.vue`) |
| `FIELD_RENDERER_SLOTS` | Inherited parent slots (`Form.vue`) |
| `USE_SECRET_INPUT_KEY` | Toggles secret-input rendering on `StringField` (provided by the host app) |

## `data-testid` Conventions

| Element | Pattern | Example |
|---|---|---|
| Form | `ff-standard-layout-form` | |
| Field | `ff-{dotpath}` | `ff-config.redis.host` |
| Array item | `ff-array-{path}.{index}` | `ff-array-config.servers.0` |
| Object toggle | `ff-object-toggle-{path}` | `ff-object-toggle-config.redis` |
| Add button | `ff-array-add-{path}` | `ff-array-add-config.servers` |
