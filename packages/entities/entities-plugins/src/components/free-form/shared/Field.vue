<template>
  <component :is="$slots[FIELD_RENDERERS]" />

  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <!-- custom rendering -->
  <component
    :is="field.renderer.value"
    v-else-if="field.renderer.value"
    :autofocus="props.autofocus"
    :name="utils.resolveRoot(field.path.value)"
    @global-action="(name: GlobalAction, payload: any) => $emit('globalAction', name, payload)"
  />

  <template v-else>
    <!-- matched renderer -->
    <component
      :is="fieldRenderer"
      v-if="fieldRenderer"
      :autofocus="props.autofocus"
      :name="utils.resolveRoot(field.path.value)"
    />

    <!-- renderer missing alert -->
    <KAlert
      v-else
      appearance="warning"
      :message="`${field.path.value} ${field.schema.value!.type} (no renderer yet)`"
    />

    <!-- child elements -->
    <slot />
  </template>
</template>

<script setup lang="ts">
import { computed, toRef, type Slot } from 'vue'
import { useExpressionField, useField, FIELD_RENDERERS } from './composables'
import * as utils from './utils'

import ExpressionField from './ExpressionField.vue'
import { resolveFieldComponent } from './field-dispatch'
import type { GlobalAction, BaseFieldProps } from './types'

defineOptions({ name: 'AutoField' })

defineEmits<{
  (e: 'globalAction', name: GlobalAction, payload: any): void
}>()

const props = defineProps<BaseFieldProps>()

defineSlots<
  {
    default?: Slot
    [FIELD_RENDERERS]?: Slot<BaseFieldProps>
  } & Record<string, Slot<BaseFieldProps>>
>()

const field = useField(toRef(props, 'name'))

const expression = useExpressionField(toRef(() => field.path?.value ?? ''))

const fieldRenderer = computed(() => {
  // A field the Gateway marks `expressible` renders as one unit that owns both
  // its plain value and the expression that can override it. Checked ahead of
  // the type mapping, but still below the slot and `FieldRenderer` overrides
  // above — so a plugin replacing the field replaces both halves.
  if (expression.available.value) {
    return ExpressionField
  }

  return resolveFieldComponent(field.schema?.value)
})
</script>
