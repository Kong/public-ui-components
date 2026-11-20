<template>
  <div class="debug-settings">
    <Field name="observability.log_level" />
    <Field name="observability.sample_rate" />
  </div>
</template>

<script setup lang="ts">
import { Field } from '../../src'

// Renders its fields in its own template, which the form can't see before it
// mounts: its reveal adapter (see `reveal-adapters.ts`) names them.
</script>
