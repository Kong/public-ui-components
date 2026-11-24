# Custom Fields

## Custom Field Rendering

Override how specific fields render using `FieldRenderer`:

```vue
<Form :schema="schema">
  <template #[FIELD_RENDERERS]>
    <FieldRenderer :match="({ path }) => path === 'config.my_field'">
      <MyCustomField />
    </FieldRenderer>
  </template>
</Form>
```

The `match` function receives `{ path, genericPath, schema }` and returns `boolean`.

Rendering priority in `Field.vue` (highest to lowest):

1. Named slot override (by field name)
2. Custom renderer (from slot-based registration)
3. `FieldRenderer` match
4. Auto-dispatch by schema type

## Writing a Custom Field Component

The composables listed in [Architecture](architecture.md#composables-composables) are exported from the package root, so a host app can author its own field component that reads and writes a named field's value the same way `SwitchField`/`RadioField`-style components do internally — no `getValue`/`setValue` round-trip needed:

```vue
<script setup lang="ts">
import { toRef } from 'vue'
import { useField } from '@kong-ui-public/freeform'

const props = defineProps<{ name: string }>()
const { value } = useField<boolean>(toRef(() => props.name))
</script>

<template>
  <input
    type="checkbox"
    :checked="value"
    @change="value = ($event.target as HTMLInputElement).checked"
  >
</template>
```

Register it against a field path with `FieldRenderer`, or place it directly inside a `Form` slot with `name` set to the field's path — both wire into the same reactive form state as the built-in field components.

When the field needs to write an "empty" value (the user clears it, or a mode switch blanks it), use `emptyValue` from `useField()` instead of hardcoding `null` — see [Empty Field Values](empty-field-values.md).
