---
date: 2026-06-10
topic: plugin-catalog-custom-plugins
---

# Plugin Catalog Custom Plugins

## Summary

`PluginCatalog` will remain a single-page plugin directory while adding first-class visibility for installed, streamed, and cloned custom plugins. Existing custom plugins will appear in the `Custom Plugins` group, participate in the current search/filter and grid/list views, and expose configure plus permission-controlled edit/delete actions.

---

## Problem Frame

`PluginCatalog` is used as a browseable directory of plugins, but its custom plugin behavior is behind the richer custom plugin model already present elsewhere in the plugin selection experience. This creates an uneven surface: bundled Kong plugins are discoverable in the catalog, while custom plugins can be missing, partially typed, or managed inconsistently.

The goal is to make the catalog reflect the custom plugin inventory users can actually configure, without changing the catalog into a tabbed select flow or adding creation workflows.

---

## Actors

- A1. Catalog user: Opens the catalog to discover, search, filter, configure, or manage existing plugins.
- A2. Consuming application: Provides app config, routing, permissions, feature flags, and API access for the catalog.
- A3. Custom plugin API: Supplies streamed and cloned custom plugin list data when the consuming application enables and permits those capabilities.

---

## Key Flows

- F1. Catalog load with custom plugins
  - **Trigger:** A catalog user opens `PluginCatalog` in a context where custom plugin support is enabled.
  - **Actors:** A1, A2, A3
  - **Steps:** The catalog loads bundled/available plugins, loads permitted custom plugin lists, merges installed, streamed, and enabled cloned plugins into the existing directory, and renders them in the `Custom Plugins` group.
  - **Outcome:** The user sees a single catalog containing both Kong plugins and supported existing custom plugins.
  - **Covered by:** R1, R2, R3, R4, R5

- F2. Manage an existing custom plugin
  - **Trigger:** A catalog user opens actions for a custom plugin card or list row.
  - **Actors:** A1, A2
  - **Steps:** The catalog checks the relevant edit/delete permissions, shows only allowed actions, and routes configure/edit/delete through the consuming application's existing routes and callbacks.
  - **Outcome:** The user can manage existing custom plugins only when the consuming application grants permission.
  - **Covered by:** R6, R7, R8

---

## Requirements

**Catalog shape**
- R1. `PluginCatalog` must keep the current single-page catalog shape rather than introducing Kong/custom tabs.
- R2. The catalog must continue to support the existing search, side filter, grid view, and list view experiences for all rendered plugin types.
- R3. Installed, streamed, and cloned custom plugins must render in the `Custom Plugins` group.
- R4. Cloned plugins must identify their base plugin with a visible badge or equivalent metadata in the card/list experience.
- R5. Cloned plugins must not also be duplicated into their base plugin's original group.

**Capability controls**
- R6. Custom plugin visibility must follow the same custom plugin support model used by the existing plugin selection experience.
- R7. Cloned plugin support must additionally be controlled by a feature flag.
- R8. When cloned support is configured but the feature flag is off, the catalog must not request or display cloned plugins.
- R9. Installed custom plugins must use the existing schema custom plugin meaning: available custom plugin names not represented by bundled plugin metadata.

**Actions and permissions**
- R10. Existing custom plugins must support configure behavior from the catalog.
- R11. Edit and delete actions for custom plugins must be shown only when the consuming application grants the relevant permissions.
- R12. The catalog must not show a create-custom-plugin card or otherwise add a creation entry point.

**Loading and errors**
- R13. If bundled/available plugin loading fails, the catalog should keep its existing full error behavior.
- R14. If a supported custom plugin list fails to load after bundled/available plugins load successfully, the catalog must continue showing available catalog results and surface a warning that custom plugin data may be incomplete.
- R15. Permission denial or feature flag exclusion should be silent: the catalog simply omits the disabled custom plugin capability.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given custom plugin support includes installed and streamed plugins, when the catalog loads successfully, then bundled Kong plugins and supported existing custom plugins appear together in the same catalog and can be searched, filtered, and viewed in grid or list mode.
- AE2. **Covers R4, R5.** Given a cloned plugin exists for a bundled plugin, when the catalog renders it, then it appears once in `Custom Plugins` and indicates which plugin it was cloned from.
- AE3. **Covers R7, R8, R15.** Given cloned support is configured but the cloned plugin feature flag is off, when the catalog loads, then cloned plugins are neither requested nor displayed and no warning is shown solely for that flag state.
- AE4. **Covers R11, R12.** Given the user can read custom plugins but cannot edit or delete them, when custom plugins render in the catalog, then configure remains available while edit/delete and create-custom-plugin entry points are absent.
- AE5. **Covers R14.** Given bundled plugins load successfully but a supported custom plugin list fails, when the catalog finishes loading, then bundled plugins remain visible and the user sees a warning about incomplete custom plugin data.

---

## Success Criteria

- Catalog users can discover and configure existing installed, streamed, and enabled cloned custom plugins from the same single-page directory as bundled plugins.
- Consuming applications can control custom plugin visibility and management actions through support settings, permissions, and the cloned plugin feature flag without introducing Catalog-only product semantics.
- A downstream planner can implement the change without inventing page shape, custom plugin grouping, permission behavior, feature flag behavior, or partial-error handling.

---

## Scope Boundaries

- No Kong/custom tab split in `PluginCatalog`.
- No create-custom-plugin card or creation workflow in the catalog.
- No new installed plugin data source beyond the existing schema custom plugin interpretation.
- No duplicate cloned plugin placement in base plugin groups.
- No broader redesign of plugin metadata, custom plugin forms, or plugin creation flows.

---

## Key Decisions

- Keep single-page catalog shape: preserves the catalog's browse-and-filter workflow while expanding what it can show.
- Put all custom plugin types in `Custom Plugins`: keeps management and custom-type badges concentrated in one place.
- Treat cloned support as feature-flagged: allows cloned plugin rollout to be enabled independently from existing installed/streamed behavior.
- Omit create entry points: this work is about browsing and managing existing custom plugins, not adding a creation surface.

---

## Dependencies / Assumptions

- The consuming application can provide the same custom plugin support and permission decisions used by the existing plugin selection experience.
- The cloned plugin API supplies enough data for the catalog to show the cloned plugin name and its base plugin reference.
- Existing routes/callbacks for configure, edit, and delete remain the source of navigation and management behavior.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R6, R7, R11][Technical] Determine the smallest way to align `PluginCatalog` with the existing plugin selection custom plugin support and permission model without unnecessary duplication.
- [Affects R14][Technical] Decide the exact warning placement and copy for partial custom plugin list failures.
