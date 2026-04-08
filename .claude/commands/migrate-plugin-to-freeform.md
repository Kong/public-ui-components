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
- `CommonForm` is the generic fallback — most plugins can use it as-is
- `FieldRenderer` overrides specific field rendering (e.g. making a string field multiline)
- `RenderRules` (bundles + dependencies) control strategy/redis-style conditional grouping
- `PLUGIN_METADATA[pluginName].freeformRenderRules` is where render rules are registered

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

```bash
cd packages/entities/entities-plugins
node playwright/helpers/migrate-plugin.mjs \
  --plugin "$PLUGIN" \
  --scan freeform \
  --output-dir "$OUTPUT_DIR"
```

Read `$OUTPUT_DIR/freeform-fields.json`. Note:
- Fields in `fields[]` with `elementType: 'textarea'` — already textareas
- Fields with `elementType: 'other'` — custom/complex components (maps, arrays, json, etc.)
- `schema.konnect` or `schema.kongManager` — the raw backend schema for field type analysis
- `consoleErrors` — any Vue warnings or JS errors

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
2. **Type downgrade** — VFG fields with `elementType: 'textarea'` that are `elementType: 'input'` in freeform. These need a `FieldRenderer` override.
3. **Advanced section mismatch** — fields that VFG showed by default but freeform hides in advanced (or vice versa). These may affect UX but aren't blockers.

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
- **Fix**: `FieldRenderer` on the array — render each item as `<StringField multiline :rows="5" />`
- See [ExitTransformerForm.vue](../ExitTransformer/ExitTransformerForm.vue) as the pattern

**Pattern 2 — Strategy + Redis** (e.g. `config.strategy`/`config.policy` with `redis` option + sibling `config.redis` record)
- Check schema: does `config.strategy` or `config.policy` have a `one_of` containing `'redis'`? Is there a sibling `config.redis` record field?
- **Fix**: Add `freeformRenderRules` to `PLUGIN_METADATA[pluginName]` in `src/definitions/metadata.ts`:
  ```typescript
  freeformRenderRules: {
    bundles: [['config.strategy', 'config.redis']],
    dependencies: { 'config.redis': ['config.strategy', 'redis'] },
  }
  ```
- See existing examples: `rate-limiting`, `proxy-cache-advanced`, `basic-auth` in `metadata.ts`

**Pattern 3 — Single long string fields that need textarea**
- Schema: `type: 'string'`, field name suggests long content (e.g. `body_template`, `api_specification`, `body`, `script`)
- VFG: `type: 'textarea'`
- **Fix**: `FieldRenderer` matching `path === 'config.<fieldname>'` → `<StringField multiline :rows="4" />`
- See [UpstreamOauthForm.vue](../UpstreamOauth/UpstreamOauthForm.vue) as the pattern

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

**Fix** — `FieldRenderer` override with `EnumField multiple`:
```vue
<FieldRenderer
  v-slot="slotProps"
  :match="({ path }) => path === 'config.<fieldname>'"
>
  <EnumField v-bind="slotProps" multiple />
</FieldRenderer>
```

No `items` prop needed — `EnumField` calls `getSelectItems(path)` which already reads `schema.elements.one_of`.
`multiple: true` switches the component from `KSelect` to `KMultiselect`.

If the same pattern applies to multiple fields in the plugin, write one `FieldRenderer` per field (match by exact path), not a broad schema-type match (that could catch unintended fields).

**Pattern 6 — Other custom fields**
- Check if other migrations in the codebase handle this pattern (e.g. `ResponseTransformerForm`, `OpentelemetryForm`)

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

For the **edit test**: pass `--payload` with an existing plugin model to verify data round-trips correctly (API model → form display → re-submit). Design this based on what `prepareFormData` does in the plugin's form component (if it has one) or how `CommonForm` handles the data.

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
- <field paths> — need FieldRenderer with multiline StringField

#### Strategy/Redis Bundle
- <strategy field> + <redis field> — needs freeformRenderRules bundle + dependency

#### Long String → Textarea
- <field path> — VFG used textarea, needs FieldRenderer multiline override

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
- Add to `free-form.ts` mapping: `'<plugin>': { experimental: true, component: 'CommonForm' }`
- If there are strategy/redis patterns: add `freeformRenderRules` to `metadata.ts`
- Note any fields that will be in advanced section and confirm this is acceptable

**If plugin needs a dedicated form (textarea overrides, complex layout, etc.):**
1. Create `src/components/free-form/<PluginName>/` directory
2. Create `index.ts` exporting the form component
3. Create `<PluginName>Form.vue` using `StandardLayout` + `ConfigForm` + `FieldRenderer` overrides
4. Add export to `src/components/free-form/index.ts`
5. Add to `free-form.ts` mapping as `experimental: true`
6. Add `freeformRenderRules` to `metadata.ts` if needed

List each `FieldRenderer` needed with the exact `match` function and override.

**Always include this step regardless of CommonForm or dedicated form:**
7. Add `'<plugin-name>'` to the `useProvideExperimentalFreeForms([...])` array in `sandbox/pages/PluginFormPage.vue` — without this the sandbox ignores the freeform mapping and falls back to VFG.

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
- Fields that had `FieldRenderer` overrides now show the correct `elementType` (e.g. multiselect fields should show `elementType: 'other'` instead of `elementType: 'array'`)
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
