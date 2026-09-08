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
import { useField, FIELD_RENDERERS } from './composables'
import * as utils from './utils'

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

// `StringField`/`NumberField` render their own expression editor when their
// schema is `expressible`, so the type mapping alone is enough here — no
// separate dispatch for expressible fields.
const fieldRenderer = computed(() => resolveFieldComponent(field.schema?.value))
</script>
