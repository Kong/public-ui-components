# Empty Field Values

Fields resolve their "no value" representation through `FormConfig.emptyFieldValue`, not a hardcoded `null`:

```typescript
interface FormConfig<T = Record<string, any>> {
  /** Sentinel written for an empty/unset field. Defaults to `'null'`. */
  emptyFieldValue?: 'null' | 'undefined'
  prepareFormData?: (data: any) => any
  transformLabel?: (label: string, fieldPath: string) => string
  hasValue?: (data: T | undefined) => boolean
  updateOnChange?: boolean
}
```

Passed as `<Form :config="{ emptyFieldValue: 'undefined' }">`.

Two composables surface the resolved sentinel, for two different scenarios — **picking the wrong one is a common bug**:

| Composable | Backed by | Use for | Required-field behavior |
|---|---|---|---|
| `field.emptyOrDefaultValue` | `getEmptyOrDefault(path)` | **Initialization**: new map entry (`useMapField.addKey`), hidden-field reset | Forces schema structure back in: `[]` / `{}` / an explicit `schema.default` |
| `field.emptyValue` | `getEmptyValue()` | **User actively clears a value** (`handleUpdate`, mode switches that blank sibling fields) | Always the plain configured sentinel — never re-injects a default or forces structure |

Using `emptyOrDefaultValue` for a clear action is the bug to avoid: it would make a required field with an explicit `schema.default` impossible to empty, since every clear snaps it back to the default. See `StringField.vue`/`NumberField.vue`/`ArrayField.vue`'s `removeItem` for clear-action examples (`emptyValue`) versus `useMapField.ts`'s `addKey` (`emptyOrDefaultValue`). Note `ArrayField.vue`'s `addItem` calls `getDefault(path)` directly rather than `getEmptyOrDefault` — the two differ for a non-required field with an explicit `schema.default`, so it isn't an equivalent example.
