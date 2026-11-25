# Expressible Fields (`expressions`)

Some Gateway config fields can alternatively have their value supplied as a CEL expression evaluated on every request, which takes priority over the plain value. The expression lives in a **twin field under a root-level `expressions` record — a sibling of `config`, not part of it**:

```jsonc
{
  "config":      { "limit": [10, 20, 30], "minute": null },
  "expressions": { "limit": ["", "", "some_expression"] }
}
```

| Rule | Detail |
|---|---|
| Twin path | The field path with its first segment swapped: `config.minute` ↔ `expressions.minute`, `config.limit.0` ↔ `expressions.limit.0` |
| Marker | Both halves must agree: `expressible` on the source field, and the twin's `expressible_kong_type` — the type the expression must return. Clearing either turns expression mode off and leaves the plain field. An expressible *array* carries `expressible` on the array while its twins are per element, so an element inherits it from its parent |
| Array pairing | **By position, as submitted.** `expressions.limit[i]` drives `config.limit[i]` |
| Empty array slot | `""` — never `null`. Kong makes every array element `required`, so a null element fails validation. A twin array is emitted at the source array's full length with `""` in every literal slot |
| Empty scalar twin | The configured `emptyFieldValue` sentinel (absent/null); a scalar has no slot to hold |

Rendering is entirely schema-driven, so **a host needs no configuration to get it**: `StringField` and `NumberField` render their own `ExpressionEditor` below the value input whenever the field's twin resolves in the schema, and nothing otherwise. Schemas without an `expressions` record are unaffected. This is self-contained per field component rather than a separate dispatch step, so it applies equally whether the field was reached through `Field.vue`'s type-based dispatch or a host rendered `StringField`/`NumberField` directly (`MapField`'s inline string values, for one).

| Component | Use |
|---|---|
| `ExpressionEditor` | The collapsible editor on its own. `StringField`/`NumberField` render one via their `expressionEditor` prop; a host that lays the value input out itself places it directly |
