<template>
  <slot
    :error="!!fieldErrorMessage"
    :error-message="fieldErrorMessage"
    :own-errors="ownFieldErrors ?? []"
  />
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useField } from '@kong-ui-public/freeform'

// Makes a control that isn't a freeform field component (e.g. a `KSelect` that picks the
// value from an API) the field at `name`: a reveal of the path lands on it and focuses it,
// and its errors match. The control shows them from the slot props: `error-message` has
// the errors of the fields below it too, `own-errors` only those of the field itself, for
// a control that wraps the fields below it and leaves their errors to them.
const props = defineProps<{ name: string }>()

const { fieldErrorMessage, ownFieldErrors } = useField(toRef(() => props.name))
</script>
