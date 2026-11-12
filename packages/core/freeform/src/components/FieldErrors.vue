<template>
  <ul
    v-if="errors?.length"
    class="ff-field-errors"
    :data-testid="`ff-field-errors-${path}`"
  >
    <li
      v-for="(error, index) in errors"
      :key="index"
    >
      {{ error.message }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { FieldError } from '../types'

defineProps<{
  errors?: FieldError[]
  /** The field path, for the test ID */
  path?: string
}>()
</script>

<style lang="scss" scoped>
.ff-field-errors {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  list-style: none;
  margin: var(--kui-space-30, $kui-space-30) 0 0;
  padding: 0;
}
</style>
