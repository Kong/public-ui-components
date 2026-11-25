# CEL Input

Import `CelInput` from `@kong-ui-public/freeform` and language declarations from `@kong-ui-public/monaco-editor/languages/cel`. The input works standalone without a Freeform `Form` parent. Each editor takes a `kind`: the variables and functions its kind of expression can use, for completion, hover, signature help, and hints. In an AI Manager ACL form the host can pass its authorized records and runtime capabilities directly.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { KTextArea } from '@kong/kongponents'
import { CelInput } from '@kong-ui-public/freeform'
import '@kong-ui-public/freeform/style.css'
import {
  defineCelKind, kongConsumer, kongConsumerGroup, kongPrincipal,
  type CelSubjects,
} from '@kong-ui-public/monaco-editor/languages/cel'

const expression = defineModel<string>({ required: true })
const props = defineProps<{ enableCelEditor: boolean, subjects: CelSubjects, supportsPrincipalGroups: boolean }>()
const records = () => props.subjects
const kind = computed(() => defineCelKind([
  kongConsumer(records),
  kongConsumerGroup(records),
  kongPrincipal(records, { supportsPrincipalGroups: props.supportsPrincipalGroups }),
], { standardCallables: ['has', 'matches', 'contains', 'startsWith', 'endsWith', 'all', 'exists', 'map', 'filter'] }))
</script>

<template>
  <CelInput v-if="enableCelEditor" v-model="expression" label="ACL expression" :kind="kind" />
  <KTextArea v-else v-model="expression" label="ACL expression" />
</template>
```

Gateway Manager can add declarations such as `kongHttp()` and `kongRoute()`. Omitting `standardCallables` enables all built-in functions and methods. Custom kinds can provide their own `CelPlugin.variables`, `values`, and `keys`. Record collections are optional. A missing collection still allows completion of its declared field names.

Use `<CelField :name="fieldName" :kind="kind" />` for a form-bound string field. The host selects the kind and supplies authorized records. The Monaco runtime loads when a CEL input is rendered.

For expression twins, register your input component with `FieldRenderer :component` in the form's field-renderers slot. Match the twin with `isExpressionFieldSchema(schema)`. When expanded, `ExpressionEditor` passes its field name, update listener, tooltip and help slots to the registered component. Slot renderers do not replace the twin input, because a slot cannot receive those named slots. Its default input is `StringField`.
