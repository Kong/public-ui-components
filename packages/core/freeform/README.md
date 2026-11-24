# @kong-ui-public/freeform

A schema-driven dynamic form rendering engine for Kong plugin configuration, extracted from `@kong-ui-public/entities-plugins`. It contains only the generic, reusable rendering primitives — no plugin registry, no layout, no scope/Redis/credential UI — so it can be used to build custom plugin form UIs (e.g. in a different MFE) without pulling in the full entities-plugins bundle.

**Core idea**: Given a `FormSchema` (JSON-like descriptor of fields), the engine auto-renders the appropriate Vue form components with correct types, labels, validation, and layout.

Everything here is generic: no plugin registry, no layout, no scope/Redis/credential UI. That kind of
entities-plugins-specific code (layout, plugin registry, Redis types, credential fields, etc.) stays in
`@kong-ui-public/entities-plugins`, which depends on this package — never the other way around.

- [Usage](#usage)
  - [Install](#install)
  - [Basic Usage](#basic-usage)
- [Documentation](#documentation)

## Usage

### Install

```ts
import { Form, FieldRenderer, FIELD_RENDERERS } from '@kong-ui-public/freeform'
import type { FormSchema, RenderRules } from '@kong-ui-public/freeform'

import '@kong-ui-public/freeform/style.css'
```

### Basic Usage

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <Form
      ref="formRef"
      :schema="pluginSchema"
      :data="formData"
      @change="formData = $event"
    />

    <button type="submit">Save</button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import type { FormSchema } from '@kong-ui-public/freeform'

const props = defineProps<{ pluginSchema: FormSchema }>()
const formData = ref({})
const formRef = ref<InstanceType<typeof Form>>()

function handleSubmit() {
  const value = formRef.value?.getValue()
  // submit value
}
</script>
```

## Documentation

- [Architecture](docs/architecture.md): directory structure, data flow, composables, path system
- [Schema](docs/schema.md): `FormSchema`, schema to component mapping, entity checks
- [Render Rules](docs/render-rules.md): field bundles and dependencies
- [Empty Field Values](docs/empty-field-values.md): `emptyFieldValue`, `emptyValue` vs. `emptyOrDefaultValue`
- [Expressible Fields](docs/expressions.md): the `expressions` twin fields
- [CEL Input](docs/cel-input.md): `CelInput` and `CelField`
- [Custom Fields](docs/custom-fields.md): `FieldRenderer` and custom field components
- [Field Navigation](docs/field-navigation.md): `reveal(path)`
- [Closed Containers](docs/closed-containers.md): `defineRevealAdapter`, for fields in tabs, `v-if` sections and opaque components
- [Field Errors](docs/field-errors.md): `errors` and `unmatchedErrors`
- [Filler](docs/filler.md): test utilities for Cypress and Playwright, adding a new field type
- [Reference](docs/reference.md): injection keys, `data-testid` conventions
