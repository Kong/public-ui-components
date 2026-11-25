# Schema

## FormSchema Structure

The schema mirrors Kong Admin API field definitions. Defined in `form-schema.ts`.

```typescript
interface FormSchema {
  type: 'record'
  fields: NamedFieldSchema[]        // Array of { fieldName: UnionFieldSchema }
  supported_partials?: Record<string, string[]>  // Redis partial support
}

type NamedFieldSchema = { [name: string]: UnionFieldSchema }

// Field types: string | number | integer | boolean | foreign | array | set | map | record | json | function
type UnionFieldSchema = StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema
  | ArrayFieldSchema | SetFieldSchema | MapFieldSchema | RecordFieldSchema
  | JsonFieldSchema | ForeignFieldSchema
```

## Schema to Component Mapping

Defined in `field-dispatch.ts`. The mapping logic:

| Schema Type | `one_of` present? | Component |
|---|---|---|
| `string` | No | `StringField` |
| `string` | Yes | `EnumField` |
| `number` | `integer` | No | `NumberField` |
| `number` | `integer` | Yes | `EnumField` |
| `boolean` | No | `BooleanField` |
| `boolean` | Yes | `EnumField` |
| `record` | - | `ObjectField` |
| `array` | - | `ArrayField` |
| `set` (tag-like) | - | `StringArrayField` |
| `set` (enum-like) | - | `EnumField` |
| `map` | - | `MapField` |
| `json` | - | `JsonField` |
| `foreign` | - | `ForeignField` |

This is the whole mapping — `expressible` fields don't get a separate row. `StringField` and `NumberField` render their own expression editor inline whenever their schema resolves one, so no matter how they're reached (this dispatch, or a host rendering them directly) an expressible field just works. See [Expressible Fields](expressions.md).

## Entity Checks

Validation constraints at the schema level:

- `at_least_one_of` — at least one field must have a value
- `mutually_exclusive` — only one field can have a value
- `mutually_required` — all or none must have values
- `conditional` — if field X matches, then field Y must match
- `conditional_at_least_one_of` — conditional at-least-one rule
