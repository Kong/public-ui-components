# Migrate Plugin to Free-Form

You are analyzing a plugin to migrate it from the legacy VueFormGenerator (VFG) form to the free-form system.

**Before starting**, confirm the repository root and save it — all file reads and commands use this path:
```bash
pwd  # must end with /public-ui-components
```
If not, `cd` to the correct directory first. Assign it for reference:
```bash
REPO_ROOT=$(pwd)
```
All subsequent paths in this skill are relative to `$REPO_ROOT`.

The Playwright helper is at:
`packages/entities/entities-plugins/playwright/helpers/migrate-plugin.mjs`

---

## Step 1 — Understand Free-Form

Read `packages/entities/entities-plugins/src/components/free-form/README.md` to understand the system.

Key points to remember:
- `CommonForm` is the generic fallback — most plugins can use it without a custom Vue component
- Each plugin registers its configuration in `src/components/free-form/plugins/` via `definePluginConfig()`
- The registry auto-discovers both `plugins/*.ts` and `plugins/*/index.ts` via `plugin-registry.ts`
- `renderRules` (bundles + dependencies) control strategy/redis-style conditional grouping — defined per plugin
- `fieldRenderers` is a declarative array of `{ match, component, propsOverrides }` for simple overrides
- `<FieldRenderer>` Vue slot component is used inside custom Vue form components for complex slot composition (nested components)
- **AIMcpProxy** (`plugins/ai-mcp-proxy/`) is the canonical example of a custom Vue component using slot-based `<FieldRenderer>` with `genericPath` matching

---

## Step 2 — Ensure Freeform Mode and Dev Server

Check that freeform mode is set:
```bash
grep VITE_FORCE_PLUGIN_FORM_ENGINE $REPO_ROOT/.env.development.local
```

If not `freeform`, update it:
```bash
sed -i '' "s/VITE_FORCE_PLUGIN_FORM_ENGINE=.*/VITE_FORCE_PLUGIN_FORM_ENGINE='freeform'/" \
  $REPO_ROOT/.env.development.local
```

Check if the dev server is running:
```bash
lsof -ti:5173
```

If not running, start it and wait:
```bash
cd packages/entities/entities-plugins
USE_SANDBOX=true $REPO_ROOT/node_modules/.bin/vite \
  > /tmp/entities-plugins-dev.log 2>&1 &
for i in $(seq 1 30); do curl -s http://localhost:5173 > /dev/null && echo "ready after ${i}s" && break; sleep 1; done
```

---

## Step 3 — Set Up Output Directory

```bash
PLUGIN=<plugin-name>
OUTPUT_DIR="/tmp/plugin-migrate-${PLUGIN}"
rm -rf "$OUTPUT_DIR" && mkdir -p "$OUTPUT_DIR"
```

---

## Step 4 — Freeform Scan

Run the Playwright helper in freeform mode. This captures:
- All rendered `ff-*` field testids with their element types (input/textarea/select)
- Schema from the backend API (Konnect + Kong Manager)
- Console errors
- Full-page screenshot

The helper automatically:
1. **Expands advanced sections** — clicks "Show additional settings"
2. **Enables ObjectField switches** — for optional objects (nullable records), enables the KInputSwitch so the object becomes active, which auto-expands it via `watch(realAdded)`
3. **Expands collapsed ObjectFields** — clicks toggle buttons for objects that are active but still collapsed
4. **Adds one array item** per visible `ff-add-item-btn-*` button — so item-level fields (e.g. `config.allow_patterns.0`) are captured

```bash
cd packages/entities/entities-plugins
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --scan freeform \
  --output-dir "$OUTPUT_DIR"
```

Read `$OUTPUT_DIR/freeform-fields.json`. Note:
- `objectsExpanded` — number of ObjectField switch/toggle actions taken. If `> 0`, confirm that child fields of those objects actually appear in `fields[]`. A non-zero count does not guarantee success — verify by checking that expected leaf fields (e.g. `ff-config.redis.host`) are present.
- `arrayItemsAdded` — number of "Add item" buttons clicked. Confirm that item-level fields (e.g. `ff-config.allow_patterns.0`) appear in `fields[]` for each array.
- Fields in `fields[]` with `elementType: 'textarea'` — already textareas
- Fields with `elementType: 'other'` — custom/complex components (maps, arrays, json, etc.)
- `schema.konnect` or `schema.kongManager` — the raw backend schema for field type analysis
- `consoleErrors` — any Vue warnings or JS errors
- `schema.konnect.supported_partials` — if present, certain config sub-paths (e.g. `config.embeddings`, `config.vectordb`) support the Redis partial selector UI. This is handled automatically by `PluginForm` when `enable-redis-partial` is passed; **no action needed in the plugin's `.ts` config file**.

If schema fetch returned 401 for Konnect (no auth), continue with Kong Manager schema only.

---

## Step 5 — VFG Scan

Switch the dev server to VFG mode:

```bash
# Stop current server
kill $(lsof -ti:5173) 2>/dev/null; sleep 1

# Switch to VFG
sed -i '' "s/VITE_FORCE_PLUGIN_FORM_ENGINE=.*/VITE_FORCE_PLUGIN_FORM_ENGINE='vfg'/" \
  $REPO_ROOT/.env.development.local

# Restart server
cd packages/entities/entities-plugins
USE_SANDBOX=true $REPO_ROOT/node_modules/.bin/vite \
  > /tmp/entities-plugins-dev.log 2>&1 &
for i in $(seq 1 30); do curl -s http://localhost:5173 > /dev/null && echo "ready after ${i}s" && break; sleep 1; done
```

Run the VFG scan:
```bash
cd packages/entities/entities-plugins
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --scan vfg \
  --output-dir "$OUTPUT_DIR"
```

The VFG helper automatically expands advanced sections and clicks array "Add item" buttons (class `kong-form-new-element-button-label`). Check `arrayItemsAdded` in `vfg-fields.json` and confirm item-level fields appear for each array.

If the helper warns "freeform layout detected", the server didn't switch — troubleshoot before continuing.

Restore freeform mode after:
```bash
kill $(lsof -ti:5173) 2>/dev/null; sleep 1

sed -i '' "s/VITE_FORCE_PLUGIN_FORM_ENGINE=.*/VITE_FORCE_PLUGIN_FORM_ENGINE='freeform'/" \
  $REPO_ROOT/.env.development.local

cd packages/entities/entities-plugins
USE_SANDBOX=true $REPO_ROOT/node_modules/.bin/vite \
  > /tmp/entities-plugins-dev.log 2>&1 &
for i in $(seq 1 30); do curl -s http://localhost:5173 > /dev/null && echo "ready after ${i}s" && break; sleep 1; done
```

---

## Step 6 — Compare Fields

Read both `freeform-fields.json` and `vfg-fields.json`.

**Match by normalizing labels/paths:**
- VFG fields have `label` (display text, e.g. "Host")
- Freeform fields have `testid` path (e.g. `ff-config.host`) and a schema field name

Produce a comparison:
1. **Missing in freeform** — VFG fields whose label/path has no corresponding freeform testid. These are fields users cannot fill in freeform mode.
2. **Type downgrade** — VFG fields with `elementType: 'textarea'` that are `elementType: 'input'` in freeform. These need a `fieldRenderers` override.
3. **Advanced section mismatch** — fields that VFG showed by default but freeform hides in advanced (or vice versa). These may affect UX but aren't blockers.

> **Warning — `renderRules` hides fields from the freeform snapshot.** Any field that is conditionally hidden (e.g. a dependent sub-record like `config.redis`, `config.vectordb.pgvector`, or any field behind a strategy/policy dependency) will not appear in the scan when its controlling field has no default or a non-matching default. Do **not** flag those sub-fields as "missing in freeform". Verify them with the dependency toggle check in Step 11 instead.

---

## Step 7 — Pattern Analysis (Schema + VFG Schema)

Look for the VFG schema definition file for this plugin:
```bash
ls packages/entities/entities-plugins/src/definitions/schemas/
```

Find the file matching the plugin name (e.g. `ExitTransformer.ts`, `CORS.ts`). Read it and look for:
- `type: 'textarea'` or `inputAttributes: { type: 'textarea' }` → marks fields that must be textarea in freeform
- `type: 'object-advanced'` or `FieldAdvanced` usage → marks fields VFG hid in an advanced dropdown

Also analyze the backend schema (from Step 4):

**Pattern 1 — Lua function arrays** (`*_by_lua`, `functions`, `body_filter`, `access`, etc.)
- In schema: `type: 'array'`, element type `string`
- In VFG: textarea per item
- In freeform: array of `StringField` (plain text input by default)
- **Fix**: `fieldRenderers` entry with `multiline: true` on the array's item renderer, OR a custom Vue component if slot nesting is needed

**Pattern 2 — Strategy + Redis** (e.g. `config.strategy`/`config.policy` with `redis` option + sibling `config.redis` record)
- Check schema: does `config.strategy` or `config.policy` have a `one_of` containing `'redis'`? Is there a sibling `config.redis` record field?
- **Fix**: Add `renderRules` to the plugin's config file in `src/components/free-form/plugins/`:
  ```typescript
  export default definePluginConfig({
    experimental: true,
    renderRules: {
      bundles: [['config.strategy', 'config.redis']],
      dependencies: { 'config.redis': ['config.strategy', 'redis'] },
    },
  })
  ```
- See existing examples: `plugins/rate-limiting.ts`, `plugins/proxy-cache-advanced.ts`, `plugins/basic-auth.ts`

**Pattern 2b — Nested strategy controlling multiple sub-records** (AI plugins, e.g. `config.vectordb.strategy` with `one_of: ['redis', 'pgvector']` and sibling `config.vectordb.redis` + `config.vectordb.pgvector` records)
- The renderRules engine validates that all fields in a bundle are at the **same level** — use full nested paths in both `bundles` and `dependencies`, and the engine extracts the common parent automatically.
- **Fix**: Use full nested paths:
  ```typescript
  export default definePluginConfig({
    experimental: true,
    renderRules: {
      bundles: [
        ['config.vectordb.strategy', 'config.vectordb.redis', 'config.vectordb.pgvector'],
      ],
      dependencies: {
        'config.vectordb.redis': ['config.vectordb.strategy', 'redis'],
        'config.vectordb.pgvector': ['config.vectordb.strategy', 'pgvector'],
      },
    },
  })
  ```
- A bundle can contain more than two fields — add one entry per dependent sub-record. The strategy field (first in the bundle) is always visible; the rest are hidden until strategy matches.
- See `plugins/ai-semantic-cache.ts` as the example.

**Pattern 3 — Single long string fields that need textarea**
- Schema: `type: 'string'`, field name suggests long content (e.g. `body_template`, `api_specification`, `body`, `script`)
- VFG: `type: 'textarea'`
- **Fix**: Declarative `fieldRenderers` in the plugin config:
  ```typescript
  import StringField from '../shared/StringField.vue'
  import { definePluginConfig } from '../shared/define-plugin-config'

  export default definePluginConfig({
    experimental: true,
    fieldRenderers: [
      {
        match: 'config.<fieldname>',
        component: StringField,
        propsOverrides: { multiline: true, rows: 4 },
      },
    ],
  })
  ```
- See `plugins/upstream-oauth.ts` as the pattern

**Pattern 4 — Missing fields (not in freeform)**
- If a field exists in the schema but doesn't render in freeform, it may be hidden by `CommonForm`'s field categorization, or the schema type isn't handled by `Field.vue`
- Check `Field.vue` dispatch switch for unrecognized field types
- Check if the field is nested deeper and needs `ObjectField` expansion

**Pattern 5 — Array with element `one_of` → multiselect**

`Field.vue` always maps `array` type to `ArrayField` regardless of whether elements have `one_of`. This means an array of strings from a fixed vocabulary (e.g. HTTP methods, protocols) renders as a list of individual dropdowns instead of a single multiselect.

Check the schema for each `array` field:
```
schema.type === 'array'
schema.elements.type === 'string' | 'integer' | 'number'   (primitive element)
schema.elements.one_of exists and is non-empty
```

Then ask: **do duplicates make semantic sense, or is this "pick N from a list"?**

- Duplicates meaningless (e.g. `methods: ['GET', 'POST']`, `protocols`, `scopes`) → use **multiselect**
- Duplicates meaningful, or order is user-managed → keep as **ArrayField**

**Fix** — declarative `fieldRenderers` with `EnumField multiple`:
```typescript
import EnumField from '../shared/EnumField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.<fieldname>',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})
```

No `items` prop needed — `EnumField` calls `getSelectItems(path)` which already reads `schema.elements.one_of`.
`multiple: true` switches the component from `KSelect` to `KMultiselect`.

If the same pattern applies to multiple fields, add one entry per field in the `fieldRenderers` array.

**Pattern 6 — Complex slot composition (custom Vue component needed)**

When the fix requires nested slot rendering that cannot be expressed as `{ component, propsOverrides }`, use a custom Vue component. Examples:
- Rendering a `MapField` with a custom slot for each value (like AIMcpProxy's `query`/`headers` → `StringArrayField` inside `MapField`)
- Array fields with custom `item-label`, `appearance="tabs"`, `sticky-tabs` props
- Any case where a field renderer needs to render child components in slots

In these cases, create a dedicated form component and use slot-based `<FieldRenderer>` (Vue template syntax). See `plugins/ai-mcp-proxy/AIMcpProxyForm.vue` as the canonical example.

The `match` prop in slot-based `<FieldRenderer>` accepts:
- `({ path }) => path === 'config.tools'` — exact path match
- `({ genericPath }) => genericPath === 'config.tools.*.query'` — wildcard match for nested paths inside arrays

**Pattern 7 — Other custom fields**
- Check if other migrations in the codebase handle this pattern (e.g. `plugins/response-transformer.ts`, `plugins/opentelemetry.ts`)

---

## Step 8 — Submit/Edit Test

Design a basic test payload based on schema analysis. Use required fields and fill optional fields with representative values. The schema's `required: true` fields must be included.

Example from schema: if `config.host` is `required: true, type: 'string'`, add `"config.host": "example.com"`.
If `config.strategy` is `type: 'string', one_of: ['local', 'redis']`, use `"config.strategy": "local"`.

Run the submit test (server must be in freeform mode):
```bash
cd packages/entities/entities-plugins
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --submit-test \
  --payload '{"config":{"<field>":"<value>",...}}' \
  --output-dir "$OUTPUT_DIR"
```

Read `$OUTPUT_DIR/submit-result.json`:
- `fillLog` — which fields were filled, which were skipped (custom dropdowns can't be filled this way)
- `capturedRequests[].body` — the actual payload that would be sent to the API. Verify it matches the expected structure.
- `consoleErrors` — Vue warnings or validation errors during fill
- `submitError` — if the submit button click failed

For custom dropdowns (KSelect-based `EnumField`), note them in the summary — they can't be filled via this helper and require manual or Cypress-based testing.

If `capturedRequests` is empty, the form may have prevented submission (validation errors). Look at `consoleErrors` and the `post-submit.png` screenshot for error messages.

For the **edit test**: pass `--payload` with an existing plugin model to verify data round-trips correctly (API model → form display → re-submit).

---

## Step 9 — Summary and Customization Plan

Print a structured summary:

```
## Migration Analysis: <plugin-name>

### Field Comparison (VFG vs Freeform)

#### Missing in Freeform
- <VFG label> — <reason / schema path>

#### Type Downgrades (textarea → input)
- <field path> — VFG: textarea, Freeform: input[type=text]

#### Advanced Section Changes
- <field> — VFG: default, Freeform: advanced (or vice versa)

### Pattern Flags

#### Lua Function Arrays
- <field paths> — need fieldRenderers multiline override or custom component

#### Strategy/Redis Bundle
- <strategy field> + <redis field> — needs renderRules bundle + dependency

#### Long String → Textarea
- <field path> — VFG used textarea, needs fieldRenderers multiline override

#### Complex Slot Composition
- <field path> — needs custom Vue component (slot-based FieldRenderer)

#### Other Patterns
- <anything else found>

### Submit Test Results
- Fields filled: <n>
- Fields skipped (custom dropdown): <list>
- API payload captured: <yes/no>
- Payload correct: <yes/no — explain discrepancy if any>
- Console errors: <list or "none">

### Schema Analysis Notes
<observations about complex types, entity checks, unusual field arrangements>

### Generated Files
- $OUTPUT_DIR/freeform-fields.json
- $OUTPUT_DIR/vfg-fields.json
- $OUTPUT_DIR/submit-result.json
- $OUTPUT_DIR/<plugin>-freeform.png
- $OUTPUT_DIR/<plugin>-vfg.png
- $OUTPUT_DIR/<plugin>-pre-submit.png
- $OUTPUT_DIR/<plugin>-post-submit.png
```

---

## Step 10 — Customization Plan

Based on the analysis above, suggest the implementation plan:

**If plugin can use CommonForm with no changes:**
- Create `src/components/free-form/plugins/<kebab-plugin-name>.ts`:
  ```typescript
  import { definePluginConfig } from '../shared/define-plugin-config'

  export default definePluginConfig({
    experimental: true,
  })
  ```

**If plugin needs render rules only (strategy/redis pattern):**
- Create `src/components/free-form/plugins/<kebab-plugin-name>.ts` with `renderRules`

**If plugin needs fieldRenderers only (textarea overrides, multiselect):**
- Create `src/components/free-form/plugins/<kebab-plugin-name>.ts` with `fieldRenderers` array
- Import the field component (e.g. `StringField`, `EnumField`) from `../shared/`

**If plugin needs both render rules and field renderers:**
- Combine `renderRules` and `fieldRenderers` in the same `.ts` file

**If plugin needs a custom Vue component (complex slot composition):**
1. Create `src/components/free-form/plugins/<kebab-plugin-name>/` directory
2. Create `<kebab-plugin-name>/index.ts`:
   ```typescript
   import MyPluginForm from './MyPluginForm.vue'
   import { definePluginConfig } from '../../shared/define-plugin-config'

   export default definePluginConfig({
     experimental: true,
     component: MyPluginForm,
   })
   ```
3. Create `<kebab-plugin-name>/MyPluginForm.vue` using `StandardLayout` + slot-based `<FieldRenderer>`:
   ```vue
   <template>
     <StandardLayout v-bind="props">
       <template #field-renderers>
         <FieldRenderer
           v-slot="slotProps"
           :match="({ path }) => path === 'config.my_field'"
         >
           <MyCustomComponent v-bind="slotProps" />
         </FieldRenderer>
       </template>
       <ObjectField as-child name="config" reset-label-path="reset" />
     </StandardLayout>
   </template>
   <script setup lang="ts">
   import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
   import { provide } from 'vue'
   import StandardLayout from '../../shared/layout/StandardLayout.vue'
   import FieldRenderer from '../../shared/FieldRenderer.vue'
   import ObjectField from '../../shared/ObjectField.vue'
   import type { Props } from '../../shared/layout/StandardLayout.vue'

   const props = defineProps<Props>()
   const slots = defineSlots<{ [K in typeof AUTOFILL_SLOT_NAME]: () => any }>()
   provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
   </script>
   ```

**Always include this step regardless of plugin type:**
Add `'<plugin-name>'` to the `useProvideExperimentalFreeForms([...])` array in `sandbox/pages/PluginFormPage.vue` — without this the sandbox ignores the plugin config and falls back to VFG.

**No need to:**
- Edit `free-form/index.ts` — the registry is auto-discovered
- Edit `src/utils/free-form.ts` — this file no longer exists
- Edit `src/definitions/metadata.ts` for `freeformRenderRules` — render rules are now in each plugin's config file

Ask the user:
> Would you like me to implement the customization plan, or save this analysis as a markdown file?

If saving as markdown, write to `$OUTPUT_DIR/migration-analysis.md`.

---

## Step 11 — Verify Implementation

After implementing, ask the user:
> Would you like me to run a verification scan to confirm the form works as expected?

If yes, run the freeform scan again (dev server must be in freeform mode and running the updated code):
```bash
cd packages/entities/entities-plugins
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --scan freeform \
  --output-dir "$OUTPUT_DIR"
```

Check:
- `consoleErrors` — no new Vue warnings or JS errors introduced by the custom form
- Fields that had `fieldRenderers` overrides now show the correct `elementType` (e.g. multiselect fields should show `elementType: 'other'` instead of `elementType: 'array'`)
- No fields missing that were present before

Then re-run the submit test to confirm the payload is still correct:
```bash
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --submit-test \
  --payload '<same payload as Step 8>' \
  --output-dir "$OUTPUT_DIR"
```

Confirm `capturedRequests[].body` matches expectations and `submitError` is null.

**If the plugin has `renderRules` with conditional field visibility**, also verify the dependency toggle. For each controlling field (e.g. `config.strategy`, `config.vectordb.strategy`, `config.policy`), programmatically select each possible value and confirm that:
- The expected dependent sub-fields become visible when their condition is met
- The other dependent sub-fields are hidden at the same time

```javascript
// Example: verify strategy toggle using Playwright
async function verifyStrategyToggle(page, strategyTestid, values) {
  for (const value of values) {
    // Click the KSelect trigger
    await page.locator(`[data-testid="${strategyTestid}"]`).first().click()
    await page.waitForTimeout(300)
    // Click the matching option in the popover
    const itemsTestid = strategyTestid.replace('ff-', 'ff-enum-') + '-items'
    await page.locator(`[data-testid="${itemsTestid}"]`).first()
      .locator('[data-testid]').filter({ hasText: value }).first().click()
    await page.waitForTimeout(600)

    const visible = await page.locator(`[data-testid^="ff-config.${value}"]:visible`).count()
    console.log(`strategy=${value}: ${visible} fields visible`)
  }
}
```

This catches cases where the field comparison looked complete (all VFG fields accounted for) but the conditional visibility was never actually exercised.
