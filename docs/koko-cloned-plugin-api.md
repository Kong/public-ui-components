# Koko Cloned Plugin API

**Jira:** KOKO-3553 (Done)  
**Koko PRs:** #8168 (API stub), #8232 (persistence), #8247 (full impl)  
**Source:** `kong-konnect/koko-private` main branch

---

## ClonedPlugin Entity

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Optional on create, server-assigned |
| `name` | string | **Required.** Globally unique; cannot change while any plugin references it |
| `ref` | string | **Required, Immutable.** Name of the base plugin being cloned. Must have `cloneable = true` in its Lua schema. Currently only bundled Kong plugins |
| `priority` | integer (nullable) | Optional; inherits from `ref` plugin if unset |
| `tags` | string[] (nullable) | Standard tags |
| `created_at` | integer (nullable) | Unix epoch, output-only |
| `updated_at` | integer (nullable) | Unix epoch, output-only, CONTROL_PLANE_ONLY |
| `managed_by` | object (nullable) | Arbitrary JSON, Konnect-only, CONTROL_PLANE_ONLY, not synced to Gateway |

---

## Business Rules

- **Max 5 cloned plugin instances per `ref`** — enforced by Koko (not the Gateway)
- **Delete** fails HTTP 400 if any plugin instances still reference the cloned plugin
- **Rename** (`name` update) is blocked when active plugin instances reference it
- `ref` is **immutable** after creation

---

## Public API (Konnect control plane)

Base: `/control-planes/{controlPlaneId}/core-entities`  
All endpoints: `x-unstable: true`, `x-internal: true`

| Method | Path | Response |
|---|---|---|
| `GET` | `/cloned-plugins` | 200, paginated list |
| `POST` | `/cloned-plugins` | 201 |
| `GET` | `/cloned-plugins/{ClonedPluginId}` | 200, get by ID or name |
| `PUT` | `/cloned-plugins/{ClonedPluginId}` | 200, upsert |
| `DELETE` | `/cloned-plugins/{ClonedPluginId}` | 204 |

No workspace-scoped variants (removed in PR #8247).

---

## Internal Admin API (gRPC/HTTP)

Base: `/v1`

| Method | Path | RPC |
|---|---|---|
| `GET` | `/v1/cloned-plugins` | ListClonedPlugins |
| `POST` | `/v1/cloned-plugins` | CreateClonedPlugin |
| `GET` | `/v1/cloned-plugins/{id}` | GetClonedPlugin |
| `PUT` | `/v1/cloned-plugins/{item.id}` | UpsertClonedPlugin |
| `DELETE` | `/v1/cloned-plugins/{id}` | DeleteClonedPlugin |

---

## Supporting Schemas API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v1/schemas/json/cloned-plugin/validate` | Validate a cloned plugin body |
| `GET` | `/v1/schemas/lua/plugins/{name}` | Get Lua schema; includes `cloneable` flag |

Use `GET /v1/schemas/lua/plugins/{name}` to discover which plugins have `cloneable = true` (valid `ref` values).

---

## UI Implementation Notes

1. Discover clonable plugins via `GET /v1/schemas/lua/plugins/{name}` → check `cloneable = true`
2. CRUD via `/control-planes/{cpId}/core-entities/cloned-plugins`
3. Minimum required fields to create: `name` + `ref`
4. Handle or enforce the max-5-per-ref limit in the UI
