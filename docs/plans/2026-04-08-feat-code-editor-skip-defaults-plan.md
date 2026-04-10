---
title: "feat: Code Editor Skip Defaults"
type: feat
date: 2026-04-08
brainstorm: docs/brainstorms/2026-04-08-code-editor-skip-defaults-brainstorm.md
---

# feat: Code Editor Skip Defaults

## Overview

Add a "Skip Defaults" toggle to the freeform Code Editor toolbar. When enabled, YAML fields whose values equal their schema-defined defaults are hidden from the editor view, giving users a clean, minimal configuration. Defaults are transparently merged back on every content change, so submissions always include complete data.

Both `shared/CodeEditor.vue` and `plugins/datakit/CodeEditor.vue` are in scope, sharing logic via a new `useSkipDefaults()` composable.

## Technical Approach

### Data Layer

All operations go through the deserialized (user-readable) layer:

```
Display: getValue() → omit(__ui_data) → stripDefaults(data, schemaDefaults) → yaml.dump
Edit:    yaml.load → deepMerge(getValue(), parsedYaml) → setValue()  (setValue handles keyIdMap.serialize internally)
```

### Deep Merge (not shallow spread)

When skip-defaults is ON, the user's YAML is missing default-value fields. A shallow spread `{ ...getValue(), ...parsedYaml }` would lose nested defaults because top-level keys in `parsedYaml` fully replace their counterparts in `getValue()`.

Example: `getValue()` = `{ config: { host: 'x', timeout: 60000, retries: 5 } }`. Stripped YAML shows `config: { host: 'x' }`. User edits `host` to `'y'`. Parsed = `{ config: { host: 'y' } }`. Shallow spread → `{ config: { host: 'y' } }` — `timeout` and `retries` lost.

Solution: a recursive merge that merges objects but **replaces** arrays (arrays are user-authoritative in YAML editing):

```typescript
function deepMergeConfig(base: any, override: any): any {
  if (override == null || typeof override !== 'object' || Array.isArray(override)) return override
  if (base == null || typeof base !== 'object' || Array.isArray(base)) return override
  const result: Record<string, any> = { ...base }
  for (const key of Object.keys(override)) {
    result[key] = deepMergeConfig(base[key], override[key])
  }
  return result
}
```

This lives in `shared/utils.ts` alongside `stripDefaults`.

The raw `getDefault()` from `useSchemaHelpers` (not form-context's KeyId-wrapped version) provides schema defaults for comparison. The composable obtains it by instantiating `useSchemaHelpers(schema)` with the `schema` ref from `useFormShared()`.

### Guard Flag

Programmatic `code` ref updates (toggle, regeneration) must NOT trigger `onDidChangeModelContent` → `setValue`. A boolean `isRegeneratingCode` flag gates the handler, following the `skipUpdateScopeCache` pattern in `StandardLayout.vue:505`.

## Implementation Phases

### Phase 1: i18n + `stripDefaults` + `deepMergeConfig` pure functions + unit tests

**i18n** (`src/locales/en.json`):

Add key before component work so templates don't have dangling references:

```json
"code_editor": {
  "mode": "Code editor",
  "skip_defaults": "Skip defaults"
}
```

- [ ] Add `skip_defaults` key under `plugins.form.free_form.code_editor`

**Pure functions:**

**Files:**
- `shared/utils.ts` — add functions
- `shared/utils.spec.ts` — add tests

```typescript
// shared/utils.ts
import { isEqual } from 'lodash-es'

/**
 * Recursively removes fields from `data` whose values deeply equal
 * the corresponding field in `defaults`.
 *
 * Both arguments must be in the same representation (user-readable, no KeyIds).
 * Uses order-sensitive isEqual for arrays/sets — deliberate trade-off
 * documented in the brainstorm (set types like `protocols` are semantically
 * unordered but compared by value order).
 */
export function stripDefaults(
  data: Record<string, any>,
  defaults: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key of Object.keys(data)) {
    const val = data[key]
    const def = defaults?.[key]

    // Exact match (deep) → skip
    if (isEqual(val, def)) continue

    // Both are plain objects → recurse
    if (
      val != null && typeof val === 'object' && !Array.isArray(val) &&
      def != null && typeof def === 'object' && !Array.isArray(def)
    ) {
      const nested = stripDefaults(val, def)
      if (Object.keys(nested).length > 0) {
        result[key] = nested
      }
      // Empty nested object after stripping → omit entirely
      continue
    }

    // Not equal → keep
    result[key] = val
  }

  return result
}
```

```typescript
// shared/utils.ts (continued)

/**
 * Recursively merges `override` into `base`.
 * - Plain objects: merged recursively (override keys win)
 * - Arrays: replaced entirely (user's array is authoritative)
 * - Primitives / null: replaced
 *
 * Used by skip-defaults to restore hidden default fields when the user
 * edits partial YAML. `base` is the complete form data from getValue(),
 * `override` is the parsed user YAML.
 */
export function deepMergeConfig(base: any, override: any): any {
  if (override == null || typeof override !== 'object' || Array.isArray(override)) {
    return override
  }
  if (base == null || typeof base !== 'object' || Array.isArray(base)) {
    return override
  }
  const result: Record<string, any> = { ...base }
  for (const key of Object.keys(override)) {
    result[key] = deepMergeConfig(base[key], override[key])
  }
  return result
}
```

**Test cases** (`shared/utils.spec.ts`, append to existing file):

```typescript
describe('stripDefaults', () => {
  it('should remove fields matching defaults', () => {
    const data = { a: 1, b: 2, c: 3 }
    const defaults = { a: 1, b: 99, c: 3 }
    expect(stripDefaults(data, defaults)).toEqual({ b: 2 })
  })

  it('should handle nested records recursively', () => {
    const data = { config: { host: 'custom', port: 8080 } }
    const defaults = { config: { host: 'localhost', port: 8080 } }
    expect(stripDefaults(data, defaults)).toEqual({ config: { host: 'custom' } })
  })

  it('should omit nested record entirely if all children are defaults', () => {
    const data = { config: { host: 'localhost', port: 8080 } }
    const defaults = { config: { host: 'localhost', port: 8080 } }
    expect(stripDefaults(data, defaults)).toEqual({})
  })

  it('should keep arrays that differ from defaults (order-sensitive)', () => {
    const data = { protocols: ['https', 'http'] }
    const defaults = { protocols: ['http', 'https'] }
    expect(stripDefaults(data, defaults)).toEqual({ protocols: ['https', 'http'] })
  })

  it('should remove arrays that match defaults exactly', () => {
    const data = { protocols: ['http', 'https'] }
    const defaults = { protocols: ['http', 'https'] }
    expect(stripDefaults(data, defaults)).toEqual({})
  })

  it('should remove null fields when default is also null', () => {
    const data = { a: null, b: 'value' }
    const defaults = { a: null, b: null }
    expect(stripDefaults(data, defaults)).toEqual({ b: 'value' })
  })

  it('should keep fields not present in defaults (user-added map entries)', () => {
    const data = { config: { custom_key: 'value' } }
    const defaults = { config: {} }
    expect(stripDefaults(data, defaults)).toEqual({ config: { custom_key: 'value' } })
  })

  it('should handle empty data', () => {
    expect(stripDefaults({}, { a: 1 })).toEqual({})
  })

  it('should handle empty defaults', () => {
    const data = { a: 1 }
    expect(stripDefaults(data, {})).toEqual({ a: 1 })
  })

  it('should handle deeply nested structures', () => {
    const data = { config: { redis: { host: 'custom', port: 6379, db: 0 } } }
    const defaults = { config: { redis: { host: 'localhost', port: 6379, db: 0 } } }
    expect(stripDefaults(data, defaults)).toEqual({ config: { redis: { host: 'custom' } } })
  })
})
```

```typescript
describe('deepMergeConfig', () => {
  it('should recursively merge nested objects', () => {
    const base = { config: { host: 'x', timeout: 60000, retries: 5 } }
    const override = { config: { host: 'y' } }
    expect(deepMergeConfig(base, override)).toEqual({
      config: { host: 'y', timeout: 60000, retries: 5 },
    })
  })

  it('should replace arrays entirely (not merge by index)', () => {
    const base = { protocols: ['http', 'https'] }
    const override = { protocols: ['grpc'] }
    expect(deepMergeConfig(base, override)).toEqual({ protocols: ['grpc'] })
  })

  it('should preserve base keys not in override', () => {
    const base = { a: 1, b: 2 }
    const override = { a: 10 }
    expect(deepMergeConfig(base, override)).toEqual({ a: 10, b: 2 })
  })

  it('should handle override setting a field to null', () => {
    const base = { a: 1, b: 2 }
    const override = { a: null }
    expect(deepMergeConfig(base, override)).toEqual({ a: null, b: 2 })
  })

  it('should handle deeply nested merge', () => {
    const base = { config: { redis: { host: 'old', port: 6379, db: 0 } } }
    const override = { config: { redis: { host: 'new' } } }
    expect(deepMergeConfig(base, override)).toEqual({
      config: { redis: { host: 'new', port: 6379, db: 0 } },
    })
  })

  it('should add new keys from override', () => {
    const base = { config: { host: 'x' } }
    const override = { config: { host: 'x', custom: 'new' } }
    expect(deepMergeConfig(base, override)).toEqual({
      config: { host: 'x', custom: 'new' },
    })
  })
})
```

- [ ] Add `stripDefaults` and `deepMergeConfig` to `shared/utils.ts`
- [ ] Add tests for both functions to `shared/utils.spec.ts`
- [ ] Run `vitest` to verify all tests pass

---

### Phase 2: `useSkipDefaults` composable

**Files:**
- `shared/composables/skip-defaults.ts` — new file
- `shared/composables/index.ts` — add export

```typescript
// shared/composables/skip-defaults.ts
import { ref, nextTick, type ShallowRef } from 'vue'
import { omit } from 'lodash-es'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { useFormShared } from './form-context'
import { useSchemaHelpers } from './schema'
import { stripDefaults, deepMergeConfig } from '../utils'

export function useSkipDefaults() {
  const { getValue, setValue, schema } = useFormShared()
  // Instantiate raw schema helpers (not form-context's KeyId-wrapped version)
  const { getDefault: getSchemaDefault } = useSchemaHelpers(schema)

  const skipDefaults = ref(false)
  const isRegeneratingCode = ref(false)

  /**
   * Convert current form data to YAML string.
   * When skipDefaults is on, strips fields matching schema defaults.
   */
  function toCode(): string {
    const data = omit(getValue() as Record<string, any>, ['__ui_data'])
    const displayData = skipDefaults.value
      ? stripDefaults(data, getSchemaDefault())
      : data

    return yaml.dump(displayData, {
      schema: JSON_SCHEMA,
      noArrayIndent: true,
    })
  }

  /**
   * Handle editor content change.
   * When skipDefaults is on, merges parsed YAML with current complete data
   * so hidden defaults are preserved.
   */
  function handleContentChange(
    config: Record<string, any>,
  ): boolean {
    if (isRegeneratingCode.value) return false

    if (skipDefaults.value) {
      // Deep merge: user edits override, getValue() provides missing defaults
      // Must be recursive — shallow spread would lose nested default fields
      const currentData = getValue()
      setValue(deepMergeConfig(currentData, config))
    } else {
      setValue(config)
    }

    return true
  }

  /**
   * Regenerate the YAML code ref (e.g., on toggle switch).
   * Sets the guard flag to prevent onDidChangeModelContent from firing.
   */
  function regenerateCode(code: ShallowRef<string>) {
    isRegeneratingCode.value = true
    code.value = toCode()
    // Reset after nextTick — matches skipUpdateScopeCache pattern in StandardLayout
    nextTick(() => {
      isRegeneratingCode.value = false
    })
  }

  return {
    skipDefaults,
    isRegeneratingCode,
    toCode,
    handleContentChange,
    regenerateCode,
  }
}
```

**Barrel export** (`shared/composables/index.ts`):

```typescript
// Append:
export * from './skip-defaults'
```

- [ ] Create `shared/composables/skip-defaults.ts`
- [ ] Add `export * from './skip-defaults'` to `shared/composables/index.ts`

---

### Phase 3: Integrate into shared `CodeEditor.vue`

**File:** `shared/CodeEditor.vue`

Changes:
1. Import `useSkipDefaults` and `KInputSwitch`
2. Replace `formDataToCode()` with `toCode()`
3. Wrap `onDidChangeModelContent` handler with `handleContentChange`
4. Add toolbar UI above Monaco editor
5. Watch `skipDefaults` to regenerate code

```vue
<!-- Toolbar addition (before MonacoEditor) -->
<div class="code-editor-toolbar" data-testid="code-editor-toolbar">
  <KInputSwitch
    v-model="skipDefaults"
    data-testid="code-editor-skip-defaults"
    @update:model-value="regenerateCode(code)"
  >
    <template #label>
      {{ t('plugins.form.free_form.code_editor.skip_defaults') }}
    </template>
  </KInputSwitch>
</div>
```

Key code changes:

```typescript
// Before
const { formData, setValue } = useFormShared()

function formDataToCode(): string {
  return yaml.dump((omit(toRaw(formData), ['__ui_data'])), { ... })
}

// After
const { setValue } = useFormShared()
const {
  skipDefaults, toCode, handleContentChange, regenerateCode,
} = useSkipDefaults()

// In handleEditorReady → onDidChangeModelContent:
editor.onDidChangeModelContent(() => {
  try {
    const config = yaml.load(editor.getValue() || '', { schema: JSON_SCHEMA, json: true })
    if (typeof config !== 'object' || config === null) return

    monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

    if (!handleContentChange(config as Record<string, any>)) return

    emit('change', config)
    emit('sourceChange', editor.getValue())
  } catch (error: unknown) {
    emit('error', error instanceof Error ? error.message : String(error))
  }
})
```

- [ ] Import `useSkipDefaults` and `KInputSwitch`
- [ ] Replace `formDataToCode()` with `toCode()`
- [ ] Wrap `onDidChangeModelContent` with `handleContentChange` + guard check
- [ ] Remove direct `formData` usage (use composable's `getValue` path instead)
- [ ] Add toolbar HTML with `KInputSwitch`
- [ ] Add toolbar styles (flex row, align with editor width)
- [ ] Wire `@update:model-value` to `regenerateCode(code)`

---

### Phase 4: Integrate into Datakit `CodeEditor.vue`

**File:** `plugins/datakit/CodeEditor.vue`

Same composable integration as shared CodeEditor, plus:
- Guard `setExampleCode()` and `handleConvertConfirm()` with `isRegeneratingCode`
- Toolbar placement: above the KAlert examples area or between KAlert and MonacoEditor

```typescript
// Before
const { formData, setValue } = useFormShared<DatakitPluginData>()

function formDataToCode(): string {
  return dumpYaml(omit(formData, ['__ui_data']))
}

// After
const { setValue } = useFormShared<DatakitPluginData>()
const {
  skipDefaults, isRegeneratingCode, toCode, handleContentChange, regenerateCode,
} = useSkipDefaults()

// setExampleCode — guard programmatic code update
function setExampleCode(example: DatakitExample) {
  // ... existing try/catch logic ...
  isRegeneratingCode.value = true
  code.value = dumpYaml(nextConfig)
  nextTick(() => { isRegeneratingCode.value = false })
  focusEnd()
}

// handleConvertConfirm — guard programmatic code update
function handleConvertConfirm() {
  if (!pendingConfig.value) return
  isRegeneratingCode.value = true
  code.value = dumpYaml(pendingConfig.value)
  nextTick(() => { isRegeneratingCode.value = false })
  handleConvertCancel()
}
```

Note: Datakit keeps its own `dumpYaml()` for `setExampleCode` and `handleConvertConfirm` since those set specific configs (not the full form data). Only `formDataToCode()` is replaced by `toCode()`.

- [ ] Import `useSkipDefaults` and `KInputSwitch`
- [ ] Replace `formDataToCode()` with `toCode()`
- [ ] Wrap `onDidChangeModelContent` with `handleContentChange` + guard check
- [ ] Guard `setExampleCode()` with `isRegeneratingCode`
- [ ] Guard `handleConvertConfirm()` with `isRegeneratingCode`
- [ ] Add toolbar HTML with `KInputSwitch`
- [ ] Wire `@update:model-value` to `regenerateCode(code)`

---

### Phase 5: Tests

**Unit tests** (existing `shared/utils.spec.ts`):
- Already covered in Phase 1 for `stripDefaults`

**Component tests** (existing `shared/layout/StandardLayout.cy.ts`):
- [ ] Add test: code mode with skip-defaults toggle visible
- [ ] Add test: toggle on → YAML content changes (defaults stripped)
- [ ] Add test: toggle off → YAML content restored (full data)
- [ ] Add test: edit in skip-defaults mode → submit includes all defaults

## Acceptance Criteria

- [ ] Toggle appears in code editor toolbar for both shared and Datakit editors
- [ ] When ON: fields matching schema defaults are hidden from YAML
- [ ] When OFF: all fields shown (original behavior)
- [ ] Toggling regenerates YAML without triggering unnecessary `setValue` cycles
- [ ] Editing in skip-defaults mode → saving includes all default values
- [ ] `stripDefaults` unit tests pass
- [ ] Datakit `setExampleCode` and `handleConvertConfirm` don't interfere with skip-defaults logic
- [ ] No regressions in existing code editor behavior

## Dependencies & Risks

**Low risk:**
- Feature is additive to CodeEditor — no shared interfaces change
- `stripDefaults` is a pure function, easy to test in isolation

**Medium risk:**
- Guard flag timing (`queueMicrotask`) must correctly reset after Monaco processes the programmatic change — verify in component tests
- **Behavioral change**: switching from `formData` (KeyId-keyed) to `getValue()` (real keys) for YAML serialization. This should be an improvement for plugins with map fields (real keys instead of `kid:N`), but needs verification that no consumer depends on the old serialization

## References

- Brainstorm: `docs/brainstorms/2026-04-08-code-editor-skip-defaults-brainstorm.md`
- Guard flag precedent: `shared/layout/StandardLayout.vue:505` (`skipUpdateScopeCache`)
- KInputSwitch usage: `shared/SwitchField.vue`, `shared/ObjectField.vue:91`
- Schema defaults: `shared/composables/schema.ts:229` (`getDefault`)
- i18n path: `plugins.form.free_form.code_editor.*`
- Test patterns: `shared/utils.spec.ts` (vitest, describe/it/expect)
