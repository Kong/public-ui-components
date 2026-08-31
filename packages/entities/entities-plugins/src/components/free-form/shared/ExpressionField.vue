<template>
  <div class="ff-expression-field">
    <!--
      The plain value, rendered by whatever component its schema type maps to.
      Deliberately not a `Field`: that would dispatch back here and recurse.
    -->
    <component
      :is="valueComponent"
      v-if="valueComponent"
      :autofocus="autofocus"
      :name="name"
    />

    <ExpressionEditor
      :name="name"
      :placeholder="placeholder"
    >
      <template
        v-if="$slots.help"
        #help
      >
        <slot name="help" />
      </template>
    </ExpressionEditor>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import ExpressionEditor from './ExpressionEditor.vue'
import { resolveFieldComponent } from './field-dispatch'
import { useFieldPath, useFormShared } from './composables'

import type { BaseFieldProps } from './types'

/**
 * A field the Gateway marks `expressible`: its plain value input, plus the
 * expression that can override it on every request.
 *
 * `Field.vue` dispatches here for any field whose schema declares an expression
 * twin, so this is one unit — a plugin overriding the field replaces both halves
 * rather than getting the expression appended to its own component. Where a
 * plugin lays the value input out itself (rate-limiting-advanced's paired
 * limit/window rows), use `ExpressionEditor` directly instead.
 */
defineOptions({ name: 'ExpressionField' })

const { name, placeholder, autofocus } = defineProps<BaseFieldProps & {
  /** Overrides the editor's default placeholder. */
  placeholder?: string
}>()

defineSlots<{
  /** Replaces the default help text under the expression textarea. */
  help?: () => any
}>()

const { getSchema } = useFormShared()

const path = useFieldPath(toRef(() => name))
const valueComponent = computed(() => resolveFieldComponent(getSchema(path.value)))
</script>

<style lang="scss" scoped>
.ff-expression-field {
  // The wrapper is what makes the pair one item of the surrounding fields
  // container: as two bare siblings, the editor was a flex item of its own and
  // picked up the full inter-field gap, leaving it floating far below its input.
  // That gap now sits around the pair, and this one sits inside it.
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  // Kongponents gives its input wrapper a trailing margin to separate whole
  // fields. Inside the pair the gap above owns that spacing, so it would only
  // add to it.
  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}
</style>
