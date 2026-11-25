<template>
  <slot
    :error="!!errorMessage"
    :error-message="errorMessage"
    :errors="errors"
  />
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { resolve, useField, useFormShared } from '@kong-ui-public/freeform'

// Makes a control that isn't a freeform field component (e.g. a `KSelect` that picks the
// value from an API) the field at `name`: a reveal of the path lands on it and focuses it,
// and its errors match. The control shows them from the slot props.
const props = defineProps<{
  name: string
  /** Child fields another control shows: their errors land and show there, not here */
  exclude?: string[]
}>()

const { path, fieldErrors } = useField(toRef(() => props.name), { exclude: () => props.exclude })
const { getFieldErrors } = useFormShared()

const errors = computed(() => {
  if (!path || !fieldErrors) return []
  const excluded = new Set((props.exclude ?? []).flatMap(child => getFieldErrors(resolve(path.value, child))))
  return fieldErrors.value.filter(error => !excluded.has(error))
})
const errorMessage = computed(() => errors.value.map(error => error.message).join('; '))
</script>
